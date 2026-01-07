import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface BackupSchedule {
  id: string;
  name: string;
  folder_paths: string[];
  frequency: string;
  enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
}

export const useBackupSchedules = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSchedules = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('backup_schedules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const calculateNextRun = (frequency: string, fromDate: Date = new Date()) => {
    const next = new Date(fromDate);
    switch (frequency) {
      case 'hourly':
        next.setHours(next.getHours() + 1);
        break;
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
    }
    return next;
  };

  const createSchedule = useCallback(async (schedule: {
    name: string;
    folder_paths: string[];
    frequency: string;
  }) => {
    if (!user) return null;
    
    try {
      const nextRun = calculateNextRun(schedule.frequency);
      
      const { data, error } = await supabase
        .from('backup_schedules')
        .insert({
          user_id: user.id,
          name: schedule.name,
          folder_paths: schedule.folder_paths,
          frequency: schedule.frequency,
          next_run_at: nextRun.toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      setSchedules(prev => [data, ...prev]);
      toast.success('Backup schedule created');
      return data;
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Failed to create backup schedule');
      return null;
    }
  }, [user]);

  const updateSchedule = useCallback(async (id: string, updates: Partial<{
    name: string;
    folder_paths: string[];
    frequency: string;
    enabled: boolean;
  }>) => {
    if (!user) return false;
    
    try {
      const updateData: any = { ...updates };
      if (updates.frequency) {
        updateData.next_run_at = calculateNextRun(updates.frequency).toISOString();
      }

      const { error } = await supabase
        .from('backup_schedules')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      await fetchSchedules();
      toast.success('Schedule updated');
      return true;
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Failed to update schedule');
      return false;
    }
  }, [user, fetchSchedules]);

  const deleteSchedule = useCallback(async (id: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('backup_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSchedules(prev => prev.filter(s => s.id !== id));
      toast.success('Schedule deleted');
      return true;
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
      return false;
    }
  }, [user]);

  const runBackupNow = useCallback(async (id: string) => {
    if (!user) return false;
    
    try {
      const schedule = schedules.find(s => s.id === id);
      if (!schedule) return false;

      // Mark as running
      await supabase
        .from('backup_schedules')
        .update({
          last_run_at: new Date().toISOString(),
          next_run_at: calculateNextRun(schedule.frequency).toISOString()
        })
        .eq('id', id);

      toast.success('Backup started');
      await fetchSchedules();
      return true;
    } catch (error) {
      console.error('Error running backup:', error);
      toast.error('Failed to start backup');
      return false;
    }
  }, [user, schedules, fetchSchedules]);

  return {
    schedules,
    loading,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    runBackupNow
  };
};
