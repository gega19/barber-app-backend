import { Request, Response } from 'express';
import competitionService from '../services/competition.service';
import { CompetitionPeriodStatus } from '@prisma/client';

class CompetitionController {
  async getPeriods(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as CompetitionPeriodStatus | undefined;
      const periods = await competitionService.getPeriods(
        status ? { status } : undefined
      );
      res.status(200).json({ success: true, data: periods });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get periods';
      res.status(500).json({ success: false, message });
    }
  }

  async getCurrentPeriod(req: Request, res: Response): Promise<void> {
    try {
      const period = await competitionService.getCurrentPeriod();
      res.status(200).json({ success: true, data: period });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get current period';
      res.status(500).json({ success: false, message });
    }
  }

  async getPeriodById(req: Request, res: Response): Promise<void> {
    try {
      const { periodId } = req.params;
      const period = await competitionService.getPeriodById(periodId);
      if (!period) {
        res.status(404).json({ success: false, message: 'Period not found' });
        return;
      }
      res.status(200).json({ success: true, data: period });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get period';
      res.status(500).json({ success: false, message });
    }
  }

  async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const { periodId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const result = await competitionService.getLeaderboard(periodId, limit, offset);
      res.status(200).json({
        success: true,
        data: result.entries,
        pagination: { limit, offset, total: result.total },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get leaderboard';
      res.status(500).json({ success: false, message });
    }
  }

  async getLastWinner(req: Request, res: Response): Promise<void> {
    try {
      const winner = await competitionService.getLastWinner();
      res.status(200).json({ success: true, data: winner });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get last winner';
      res.status(500).json({ success: false, message });
    }
  }

  async getBarberTopPositions(req: Request, res: Response): Promise<void> {
    try {
      const { barberId } = req.params;
      if (!barberId) {
        res.status(400).json({ success: false, message: 'barberId required' });
        return;
      }
      const positions = await competitionService.getBarberTopPositions(barberId);
      res.status(200).json({ success: true, data: positions });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get barber top positions';
      res.status(500).json({ success: false, message });
    }
  }

  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const { periodId } = req.params;
      const barberId = req.query.barberId as string;
      if (!barberId) {
        res.status(400).json({ success: false, message: 'barberId required' });
        return;
      }
      const result = await competitionService.getMyResult(periodId, barberId);
      if (!result) {
        res.status(404).json({ success: false, message: 'No result for this barber in this period' });
        return;
      }
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get my result';
      res.status(500).json({ success: false, message });
    }
  }

  async createPeriod(req: Request, res: Response): Promise<void> {
    try {
      const { name, startDate, endDate, status, prize } = req.body;
      if (!startDate || !endDate) {
        res.status(400).json({ success: false, message: 'startDate and endDate required' });
        return;
      }
      const period = await competitionService.createPeriod({
        name: name ?? undefined,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status ?? 'DRAFT',
        prize: prize ?? undefined,
      });
      res.status(201).json({ success: true, data: period });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create period';
      res.status(500).json({ success: false, message });
    }
  }

  async updatePeriod(req: Request, res: Response): Promise<void> {
    try {
      const { periodId } = req.params;
      const { name, startDate, endDate, status, prize } = req.body;
      const period = await competitionService.updatePeriod(periodId, {
        ...(name !== undefined && { name }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(status !== undefined && { status }),
        ...(prize !== undefined && { prize: prize ?? null }),
      });
      if (!period) {
        res.status(404).json({ success: false, message: 'Period not found' });
        return;
      }
      res.status(200).json({ success: true, data: period });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update period';
      res.status(500).json({ success: false, message });
    }
  }

  async recomputePeriod(req: Request, res: Response): Promise<void> {
    try {
      const { periodId } = req.params;
      await competitionService.recomputePeriodPoints(periodId);
      const period = await competitionService.getPeriodById(periodId);
      res.status(200).json({
        success: true,
        message: 'Points recomputed',
        data: period,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to recompute period';
      res.status(500).json({ success: false, message });
    }
  }

  async closePeriod(req: Request, res: Response): Promise<void> {
    try {
      const { periodId } = req.params;
      const period = await competitionService.closePeriod(periodId);
      if (!period) {
        res.status(404).json({ success: false, message: 'Period not found' });
        return;
      }
      res.status(200).json({ success: true, data: period, message: 'Period closed' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to close period';
      res.status(500).json({ success: false, message });
    }
  }

  async getHelpRules(req: Request, res: Response): Promise<void> {
    try {
      const rules = await competitionService.getHelpRules();
      res.status(200).json({ success: true, data: { rules } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get help rules';
      res.status(500).json({ success: false, message });
    }
  }

  async updateHelpRules(req: Request, res: Response): Promise<void> {
    try {
      const { rules } = req.body as { rules: string[] };
      if (!Array.isArray(rules) || rules.some((r) => typeof r !== 'string')) {
        res.status(400).json({ success: false, message: 'rules must be an array of strings' });
        return;
      }
      await competitionService.setHelpRules(rules);
      const updated = await competitionService.getHelpRules();
      res.status(200).json({ success: true, data: { rules: updated } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update help rules';
      res.status(500).json({ success: false, message });
    }
  }

  async deletePeriod(req: Request, res: Response): Promise<void> {
    try {
      const { periodId } = req.params;
      await competitionService.deletePeriod(periodId);
      res.status(200).json({ success: true, message: 'Period deleted' });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'Period not found') {
        res.status(404).json({ success: false, message: err.message });
        return;
      }
      if (err.message.includes('Borrador')) {
        res.status(400).json({ success: false, message: err.message });
        return;
      }
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export default new CompetitionController();
