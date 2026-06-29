import { apiSlice } from '../api/apiSlice';

export const complaintApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getComplaints: builder.query({
      query: () => '/complaints',
      providesTags: ['Complaint'],
    }),
    createComplaint: builder.mutation({
      query: (data) => ({
        url: '/complaints',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Complaint'],
    }),
    updateComplaint: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/complaints/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Complaint'],
    }),
  }),
});

export const {
  useGetComplaintsQuery,
  useCreateComplaintMutation,
  useUpdateComplaintMutation,
} = complaintApiSlice;
