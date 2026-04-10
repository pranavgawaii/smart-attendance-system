const assessmentModel = require('../models/assessment.model');

const getMyAllocation = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('[Student] Getting allocation for user:', userId);

        // 1. Find active assessment for this user
        const assessment = await assessmentModel.findActiveAssessmentForUser(userId);
        console.log('[Student] Active assessment:', assessment ? assessment.id : 'NONE');

        if (!assessment) {
            // No active assessment => Not shortlisted or no exam live
            // Return 200 with minimal info so frontend knows to show "No active assessment"
            return res.status(200).json({ status: 'NO_ACTIVE_ASSESSMENT' });
        }

        // 2. Check for allocation
        const allocation = await assessmentModel.findAllocationForUser(assessment.id, userId);
        console.log('[Student] Allocation:', allocation ? 'FOUND' : 'NOT FOUND');

        if (allocation) {
            return res.status(200).json({
                status: 'ALLOCATED',
                assessment_name: assessment.title,
                lab_name: allocation.lab_name,
                seat_number: allocation.seat_number,
                start_time: assessment.start_time,
                end_time: assessment.end_time
            });
        } else {
            return res.status(200).json({
                status: 'PENDING', // Shortlisted but not allocated seat
                assessment_name: assessment.title
            });
        }

    } catch (error) {
        console.error('[Student] Get My Allocation Error:', error);
        console.error('[Student] Error stack:', error.stack);
        res.status(500).json({ error: 'Internal server error fetching allocation' });
    }
};

module.exports = {
    getMyAllocation
};
