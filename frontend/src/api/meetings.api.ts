import { api } from './axios';
import type { IceServerConfig, MeetingValidation } from '@/types/meeting';

interface IceServersResponse {
  success: boolean;
  data: { iceServers: IceServerConfig[] };
}

interface ValidateResponse {
  success: boolean;
  data: MeetingValidation;
}

export const meetingsApi = {
  getIceServers: () => api.get<IceServersResponse>('/meetings/ice-servers'),

  validateMeeting: (meetingId: string, password: string) =>
    api.get<ValidateResponse>(`/meetings/${meetingId}/validate`, {
      params: { password },
    }),
};
