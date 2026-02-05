const { supabase } = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Get all coordinators (sorted alphabetically by name)
const getAllCoordinators = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('placement_coordinators')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('[Coordinators] Fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch coordinators' });
        }

        res.json(data);
    } catch (error) {
        console.error('[Coordinators] Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Add new coordinator
const addCoordinator = async (req, res) => {
    try {
        const { name, enrollment_no, email, department, year } = req.body;

        // Validate required fields
        if (!name || !enrollment_no || !email || !department || !year) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check for duplicate enrollment number
        const { data: existing } = await supabase
            .from('placement_coordinators')
            .select('id')
            .eq('enrollment_no', enrollment_no)
            .single();

        if (existing) {
            return res.status(409).json({ error: 'Enrollment number already exists' });
        }

        // Insert new coordinator
        const { data, error } = await supabase
            .from('placement_coordinators')
            .insert([{ name, enrollment_no, email, department, year }])
            .select()
            .single();

        if (error) {
            console.error('[Coordinators] Insert error:', error);
            return res.status(500).json({ error: 'Failed to add coordinator' });
        }

        res.status(201).json(data);
    } catch (error) {
        console.error('[Coordinators] Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete coordinator
const deleteCoordinator = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('placement_coordinators')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[Coordinators] Delete error:', error);
            return res.status(500).json({ error: 'Failed to delete coordinator' });
        }

        res.json({ success: true, message: 'Coordinator deleted successfully' });
    } catch (error) {
        console.error('[Coordinators] Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Generate attendance PDF - Professional Clean Design (Serverless-compatible)
const generateAttendancePDF = async (req, res) => {
    try {
        const { event_title, event_date, time_from, time_to, coordinator_ids } = req.body;

        // Validate required fields
        if (!event_title || !event_date || !time_from || !time_to || !coordinator_ids?.length) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Fetch selected coordinators (sorted alphabetically)
        const { data: coordinators, error } = await supabase
            .from('placement_coordinators')
            .select('name, enrollment_no, year')
            .in('id', coordinator_ids)
            .order('name', { ascending: true });

        if (error || !coordinators?.length) {
            return res.status(400).json({ error: 'No valid coordinators found' });
        }

        // Format date
        const formattedDate = new Date(event_date).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Create PDF with professional margins
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 50, bottom: 50, left: 60, right: 60 }
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Attendance_Letter_${event_date}.pdf"`);

        // Pipe PDF directly to response (no filesystem writes)
        doc.pipe(res);

        const pageWidth = doc.page.width;
        const contentWidth = pageWidth - 120; // margins

        // Logo path - try to load from project root
        const rootLogoPath = path.join(process.cwd(), 'mitadtlogo.png');

        // ===== HEADER WITH LOGO ON LEFT =====
        const headerY = 45;
        const logoSize = 50;
        let logoAdded = false;

        try {
            if (fs.existsSync(rootLogoPath)) {
                doc.image(rootLogoPath, 60, headerY, { width: logoSize });
                logoAdded = true;
            }
        } catch (imgError) {
            console.warn('[Coordinators] Failed to load logo image:', imgError);
            // Continue without logo
        }

        if (logoAdded) {
            // University Name - Next to logo
            doc.fontSize(16).font('Times-Bold')
                .text('MIT ADT UNIVERSITY', 120, headerY + 8);

            // Sub-header
            doc.fontSize(12).font('Times-Roman')
                .text('Training & Placement Cell', 120, headerY + 28);
        } else {
            // Fallback without logo - Centered
            doc.fontSize(16).font('Times-Bold')
                .text('MIT ADT UNIVERSITY', 60, headerY, { align: 'center', width: contentWidth });
            doc.fontSize(12).font('Times-Roman')
                .text('Training & Placement Cell', 60, doc.y + 5, { align: 'center', width: contentWidth });
        }

        // Elegant divider line
        const lineY = headerY + logoSize + 15;
        doc.strokeColor('#333333').lineWidth(0.5)
            .moveTo(60, lineY).lineTo(pageWidth - 60, lineY).stroke();
        doc.y = lineY + 25;

        // ===== LETTER CONTENT =====
        const bodyFont = 'Times-Roman';
        const bodyFontBold = 'Times-Bold';
        const fontSize = 12;

        // To section
        doc.fontSize(fontSize).font(bodyFont).text('To,', 60);
        doc.font(bodyFontBold).text('The Concerned Faculty/Teacher', 60);
        doc.moveDown(1);

        // Subject line
        doc.font(bodyFontBold)
            .text(`Subject: Request to Consider Attendance on ${formattedDate}`, 60, doc.y, { width: contentWidth });
        doc.moveDown(1.5);

        // Salutation
        doc.font(bodyFont).text('Dear Sir/Madam,', 60);
        doc.moveDown(1);

        // Body paragraph 1
        doc.font(bodyFont).text(
            `This is to respectfully inform you that the undersigned students could not attend the scheduled lectures/labs on ${formattedDate} due to Training & Placement Cell coordination work for the "${event_title}" from ${time_from} to ${time_to}.`,
            60,
            doc.y,
            { align: 'justify', width: contentWidth, lineGap: 2 }
        );
        doc.moveDown(1);

        // Body paragraph 2
        doc.text(
            'We kindly request you to grant us attendance for the mentioned day. Below is the list of student coordinators:',
            60,
            doc.y,
            { align: 'justify', width: contentWidth, lineGap: 2 }
        );
        doc.moveDown(1.5);

        // ===== CLEAN PROFESSIONAL TABLE =====
        const tableTop = doc.y;
        const colWidths = [40, 180, 160, 70];
        const tableWidth = colWidths.reduce((a, b) => a + b, 0);
        const startX = 60;
        const rowHeight = 24;
        const cellPadding = 8;

        // Table header
        doc.font(bodyFontBold).fontSize(11);
        doc.rect(startX, tableTop, tableWidth, rowHeight).stroke('#666666');

        let xPos = startX;
        doc.fillColor('#333333');
        doc.text('Sr.', xPos + cellPadding, tableTop + 7, { width: colWidths[0] - cellPadding * 2 });
        xPos += colWidths[0];
        doc.text('Name', xPos + cellPadding, tableTop + 7, { width: colWidths[1] - cellPadding * 2 });
        xPos += colWidths[1];
        doc.text('Enrollment No.', xPos + cellPadding, tableTop + 7, { width: colWidths[2] - cellPadding * 2 });
        xPos += colWidths[2];
        doc.text('Year', xPos + cellPadding, tableTop + 7, { width: colWidths[3] - cellPadding * 2 });

        // Draw header column separators
        xPos = startX + colWidths[0];
        for (let i = 0; i < 3; i++) {
            doc.moveTo(xPos, tableTop).lineTo(xPos, tableTop + rowHeight).stroke('#666666');
            xPos += colWidths[i + 1];
        }

        // Table rows
        let rowY = tableTop + rowHeight;
        doc.font(bodyFont).fontSize(11);

        coordinators.forEach((coord, index) => {
            // Row border
            doc.rect(startX, rowY, tableWidth, rowHeight).stroke('#999999');

            xPos = startX;
            doc.fillColor('#333333');
            doc.text((index + 1).toString(), xPos + cellPadding, rowY + 7, { width: colWidths[0] - cellPadding * 2 });
            xPos += colWidths[0];
            doc.text(coord.name, xPos + cellPadding, rowY + 7, { width: colWidths[1] - cellPadding * 2 });
            xPos += colWidths[1];
            doc.text(coord.enrollment_no, xPos + cellPadding, rowY + 7, { width: colWidths[2] - cellPadding * 2 });
            xPos += colWidths[2];
            doc.text(coord.year, xPos + cellPadding, rowY + 7, { width: colWidths[3] - cellPadding * 2 });

            // Column separators for each row
            let sepX = startX + colWidths[0];
            for (let i = 0; i < 3; i++) {
                doc.moveTo(sepX, rowY).lineTo(sepX, rowY + rowHeight).stroke('#999999');
                sepX += colWidths[i + 1];
            }

            rowY += rowHeight;
        });

        // ===== SIGNATURE SECTION =====
        doc.y = rowY + 50;
        doc.fillColor('#333333');
        doc.font(bodyFont).fontSize(fontSize).text('Regards,', 60);
        doc.moveDown(0.5);
        doc.font(bodyFontBold).fontSize(fontSize).text('CN-CRTP', 60);

        // Finalize PDF and end the stream
        doc.end();

    } catch (error) {
        console.error('[Coordinators] PDF Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate PDF' });
        }
    }
};

module.exports = {
    getAllCoordinators,
    addCoordinator,
    deleteCoordinator,
    generateAttendancePDF
};
