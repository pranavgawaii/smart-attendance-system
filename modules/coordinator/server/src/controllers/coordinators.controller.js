const { supabase } = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const LETTER_MARGINS = { top: 42, bottom: 52, left: 56, right: 56 };
const HEADER_TOP = 34;
const HEADER_LOGO_BOX = { width: 190, height: 74 };
const HEADER_HEIGHT = 102;
const TABLE_HEADER_HEIGHT = 32;
const TABLE_CELL_PADDING_X = 10;
const TABLE_CELL_PADDING_Y = 8;
const MIN_TABLE_ROW_HEIGHT = 28;
const SIGNATURE_GAP = 64;
const SIGNATURE_BLOCK_HEIGHT = 84;

const resolveLetterheadPath = () => {
    const candidates = [
        path.join(__dirname, '../../../assets/MIT_ADTU.png'),
        path.join(__dirname, '../../../assets/mitadtcncrtp.png'),
        path.join(process.cwd(), 'MIT_ADTU.png'),
        path.join(process.cwd(), 'mitadtcncrtp.png')
    ];

    return candidates.find((candidate) => fs.existsSync(candidate)) || null;
};

const drawLetterHeader = (doc) => {
    const { left, right } = doc.page.margins;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - left - right;
    const logoPath = resolveLetterheadPath();
    const logoWidth = 156;
    const logoX = pageWidth - right - logoWidth;
    const textX = left;
    const textWidth = Math.max(contentWidth - logoWidth - 20, 160);

    if (logoPath) {
        doc.image(logoPath, logoX, HEADER_TOP, {
            fit: [logoWidth, HEADER_LOGO_BOX.height],
            align: 'right',
            valign: 'center'
        });
    }

    doc.fillColor('#111827')
        .font('Helvetica-Bold')
        .fontSize(15)
        .text('Central Corporate Relations, Training', textX, HEADER_TOP + 22, {
            width: textWidth,
            align: 'left'
        })
        .text('and Placement Cell (CN-CRTP)', textX, HEADER_TOP + 42, {
            width: textWidth,
            align: 'left'
        });

    const dividerY = HEADER_TOP + HEADER_HEIGHT - 18;
    doc.strokeColor('#1F2937')
        .lineWidth(1)
        .moveTo(left, dividerY)
        .lineTo(pageWidth - right, dividerY)
        .stroke();

    return dividerY + 22;
};

const drawTableHeader = (doc, startY, startX, colWidths) => {
    const tableWidth = colWidths.reduce((total, width) => total + width, 0);
    const labels = ['Sr.', 'Name', 'Enrollment No.', 'Year'];

    doc.save();
    doc.rect(startX, startY, tableWidth, TABLE_HEADER_HEIGHT).fillAndStroke('#F3F4F6', '#6B7280');

    let xPos = startX;
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(10.5);

    labels.forEach((label, index) => {
        doc.text(label, xPos + TABLE_CELL_PADDING_X, startY + 10, {
            width: colWidths[index] - TABLE_CELL_PADDING_X * 2,
            align: index === 0 || index >= 2 ? 'center' : 'left'
        });

        if (index < labels.length - 1) {
            xPos += colWidths[index];
            doc.moveTo(xPos, startY).lineTo(xPos, startY + TABLE_HEADER_HEIGHT).stroke('#9CA3AF');
        }
    });
    doc.restore();

    return startY + TABLE_HEADER_HEIGHT;
};

const getTableRowHeight = (doc, values, colWidths) => {
    doc.font('Times-Roman').fontSize(11);

    const contentHeights = values.map((value, index) => (
        doc.heightOfString(String(value || ''), {
            width: colWidths[index] - TABLE_CELL_PADDING_X * 2,
            align: index === 0 || index >= 2 ? 'center' : 'left',
            lineGap: 1
        })
    ));

    return Math.max(MIN_TABLE_ROW_HEIGHT, Math.ceil(Math.max(...contentHeights) + TABLE_CELL_PADDING_Y * 2));
};

const drawTableRow = (doc, { rowY, startX, colWidths, values, rowHeight, rowIndex }) => {
    const tableWidth = colWidths.reduce((total, width) => total + width, 0);
    const backgroundColor = rowIndex % 2 === 0 ? '#FFFFFF' : '#FAFAFA';

    doc.save();
    doc.rect(startX, rowY, tableWidth, rowHeight).fillAndStroke(backgroundColor, '#9CA3AF');

    let xPos = startX;
        values.forEach((value, index) => {
            doc.fillColor('#2F3136')
                .font('Times-Roman')
                .fontSize(11)
                .text(String(value || ''), xPos + TABLE_CELL_PADDING_X, rowY + TABLE_CELL_PADDING_Y, {
                    width: colWidths[index] - TABLE_CELL_PADDING_X * 2,
                    align: index === 0 || index >= 2 ? 'center' : 'left',
                    lineGap: 1
                });

        if (index < values.length - 1) {
            xPos += colWidths[index];
            doc.moveTo(xPos, rowY).lineTo(xPos, rowY + rowHeight).stroke('#9CA3AF');
        }
    });
    doc.restore();

    return rowY + rowHeight;
};

// Get all coordinators (sorted alphabetically by name)
const getAllCoordinators = async (req, res) => {
    try {
        console.log(`[Coordinators] getAllCoordinators called by ${req.user?.email} (${req.user?.role})`);
        const { data, error } = await supabase
            .from('placement_coordinators')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('[Coordinators] Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch coordinators' });
        }
        console.log(`[Coordinators] Found ${data?.length || 0} coordinators`);

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

        // Validate required fields (email is optional)
        if (!name || !enrollment_no || !department || !year) {
            return res.status(400).json({ error: 'Name, enrollment number, department and year are required' });
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

// Update coordinator
const updateCoordinator = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, enrollment_no, email, department, year } = req.body;

        if (!name || !enrollment_no || !department || !year) {
            return res.status(400).json({ error: 'Name, enrollment number, department and year are required' });
        }

        const { data: existing, error: duplicateError } = await supabase
            .from('placement_coordinators')
            .select('id')
            .eq('enrollment_no', enrollment_no)
            .neq('id', id)
            .maybeSingle();

        if (duplicateError) {
            console.error('[Coordinators] Duplicate check error:', duplicateError);
            return res.status(500).json({ error: 'Failed to validate enrollment number' });
        }

        if (existing) {
            return res.status(409).json({ error: 'Enrollment number already exists' });
        }

        const { data, error } = await supabase
            .from('placement_coordinators')
            .update({
                name,
                enrollment_no,
                email: email || null,
                department,
                year
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[Coordinators] Update error:', error);
            return res.status(500).json({ error: 'Failed to update coordinator' });
        }

        res.json(data);
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

        const doc = new PDFDocument({
            size: 'A4',
            margins: LETTER_MARGINS
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Attendance_Letter_${event_date}.pdf"`);

        doc.pipe(res);

        const pageWidth = doc.page.width;
        const contentWidth = pageWidth - doc.page.margins.left - doc.page.margins.right;
        const tableStartX = doc.page.margins.left;
        const tableColumnWidths = [48, 190, 155, contentWidth - 48 - 190 - 155];
        const bottomLimit = () => doc.page.height - doc.page.margins.bottom;

        const bodyFont = 'Times-Roman';
        const bodyFontBold = 'Times-Bold';
        const fontSize = 12;

        const startContentY = drawLetterHeader(doc);
        doc.y = startContentY;

        doc.fontSize(fontSize).font(bodyFont).text('To,', doc.page.margins.left, doc.y);
        doc.font(bodyFontBold).text('The Concerned Faculty/Teacher', doc.page.margins.left);
        doc.moveDown(1);

        doc.font(bodyFontBold)
            .text(`Subject: Request to Consider Attendance on ${formattedDate}`, doc.page.margins.left, doc.y, {
                width: contentWidth
            });
        doc.moveDown(1.5);

        doc.font(bodyFont).text('Dear Sir/Madam,', doc.page.margins.left);
        doc.moveDown(1);

        doc.font(bodyFont).text(
            `This is to respectfully inform you that the undersigned students could not attend the scheduled lectures/labs on ${formattedDate} due to Training & Placement Cell coordination work for the "${event_title}" from ${time_from} to ${time_to}.`,
            doc.page.margins.left,
            doc.y,
            { align: 'justify', width: contentWidth, lineGap: 2 }
        );
        doc.moveDown(1);

        doc.text(
            'We kindly request you to grant us attendance for the mentioned day. Below is the list of student coordinators:',
            doc.page.margins.left,
            doc.y,
            { align: 'justify', width: contentWidth, lineGap: 2 }
        );
        doc.moveDown(1);
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827')
            .text('List of Student Coordinators', doc.page.margins.left, doc.y);
        doc.moveDown(0.6);

        let rowY = drawTableHeader(doc, doc.y, tableStartX, tableColumnWidths);

        coordinators.forEach((coord, index) => {
            const values = [
                index + 1,
                coord.name,
                coord.enrollment_no,
                coord.year
            ];
            const rowHeight = getTableRowHeight(doc, values, tableColumnWidths);

            if (rowY + rowHeight > bottomLimit()) {
                doc.addPage();
                rowY = drawTableHeader(doc, doc.page.margins.top, tableStartX, tableColumnWidths);
            }

            rowY = drawTableRow(doc, {
                rowY,
                startX: tableStartX,
                colWidths: tableColumnWidths,
                values,
                rowHeight,
                rowIndex: index
            });
        });

        if (rowY + SIGNATURE_GAP + SIGNATURE_BLOCK_HEIGHT > bottomLimit()) {
            doc.addPage();
            rowY = doc.page.margins.top;
        }

        doc.y = rowY + SIGNATURE_GAP;
        doc.fillColor('#333333');
        doc.font(bodyFont).fontSize(fontSize).text('Regards,', doc.page.margins.left);
        doc.moveDown(0.5);
        doc.font(bodyFontBold).fontSize(fontSize).text('CN-CRTP', doc.page.margins.left);

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
    updateCoordinator,
    deleteCoordinator,
    generateAttendancePDF
};
