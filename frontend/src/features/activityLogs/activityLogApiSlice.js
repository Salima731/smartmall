import { apiSlice } from '../api/apiSlice';

export const activityLogApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getActivityLogs: builder.query({
      query: (params) => ({
        url: '/activitylogs',
        params,
      }),
      providesTags: ['ActivityLog'],
    }),
  }),
});

export const { useGetActivityLogsQuery } = activityLogApiSlice;
