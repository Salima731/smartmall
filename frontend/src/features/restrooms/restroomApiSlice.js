import { apiSlice } from '../api/apiSlice';

export const restroomApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRestrooms: builder.query({
      query: (mallId) => `/restrooms/mall/${mallId}`,
      providesTags: ['Restroom'],
    }),
    updateRestroom: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/restrooms/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Restroom'],
    }),
    addMaintenanceReport: builder.mutation({
      query: ({ id, issue }) => ({
        url: `/restrooms/${id}/maintenance`,
        method: 'POST',
        body: { issue },
      }),
      invalidatesTags: ['Restroom'],
    }),
    addComplaint: builder.mutation({
      query: ({ id, complaint, rating, qrCodeId }) => ({
        url: `/restrooms/${id}/complaint`,
        method: 'POST',
        body: { complaint, rating, qrCodeId },
      }),
      invalidatesTags: ['Restroom'],
    }),
    emergencyMaintenance: builder.mutation({
      query: (mallId) => ({
        url: `/restrooms/mall/${mallId}/emergency`,
        method: 'POST',
      }),
      invalidatesTags: ['Restroom'],
    }),
    createRestroom: builder.mutation({
      query: (data) => ({
        url: '/restrooms',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Restroom'],
    }),
    deleteRestroom: builder.mutation({
      query: (id) => ({
        url: `/restrooms/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Restroom'],
    }),
  }),
});

export const { 
  useGetRestroomsQuery, 
  useUpdateRestroomMutation,
  useAddMaintenanceReportMutation,
  useAddComplaintMutation,
  useEmergencyMaintenanceMutation,
  useCreateRestroomMutation,
  useDeleteRestroomMutation
} = restroomApiSlice;
