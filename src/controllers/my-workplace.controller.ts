import { Request, Response } from 'express';
import myWorkplaceService from '../services/my-workplace.service';

class MyWorkplaceController {
    async getMyWorkplace(req: Request, res: Response): Promise<void> {
        try {
            const workplaceId = req.user?.workplaceId;
            if (!workplaceId) {
                res.status(400).json({ success: false, message: 'No workplace associated with this user' });
                return;
            }

            const workplace = await myWorkplaceService.getWorkplaceDetails(workplaceId);
            res.status(200).json({ success: true, data: workplace });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get workplace details';
            res.status(500).json({ success: false, message });
        }
    }

    async getBarbers(req: Request, res: Response): Promise<void> {
        try {
            const workplaceId = req.user?.workplaceId;
            if (!workplaceId) {
                res.status(400).json({ success: false, message: 'No workplace associated with this user' });
                return;
            }

            const barbers = await myWorkplaceService.getWorkplaceBarbers(workplaceId);
            res.status(200).json({ success: true, data: barbers });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get barbers';
            res.status(500).json({ success: false, message });
        }
    }

    async getClients(req: Request, res: Response): Promise<void> {
        try {
            const workplaceId = req.user?.workplaceId;
            if (!workplaceId) {
                res.status(400).json({ success: false, message: 'No workplace associated with this user' });
                return;
            }

            const clients = await myWorkplaceService.getWorkplaceClients(workplaceId);
            res.status(200).json({ success: true, data: clients });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get clients';
            res.status(500).json({ success: false, message });
        }
    }

    async getAppointments(req: Request, res: Response): Promise<void> {
        try {
            const workplaceId = req.user?.workplaceId;
            if (!workplaceId) {
                res.status(400).json({ success: false, message: 'No workplace associated with this user' });
                return;
            }

            const appointments = await myWorkplaceService.getWorkplaceAppointments(workplaceId);
            res.status(200).json({ success: true, data: appointments });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get appointments';
            res.status(500).json({ success: false, message });
        }
    }

    async getStats(req: Request, res: Response): Promise<void> {
        try {
            const workplaceId = req.user?.workplaceId;
            if (!workplaceId) {
                res.status(400).json({ success: false, message: 'No workplace associated with this user' });
                return;
            }

            const stats = await myWorkplaceService.getWorkplaceStats(workplaceId);
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get stats';
            res.status(500).json({ success: false, message });
        }
    }
}

export default new MyWorkplaceController();
