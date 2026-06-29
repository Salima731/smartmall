import { apiSlice } from '../api/apiSlice';

export const parkingApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getParkingStatus: builder.query({
      query: (mallId) => `/parking/mall/${mallId}`,
      providesTags: ['Parking'],
    }),
    recordEntry: builder.mutation({
      query: (data) => ({
        url: '/parking/entry',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Parking'],
    }),
    recordExit: builder.mutation({
      query: (data) => ({
        url: '/parking/exit',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Parking'],
    }),
    getParkingStats: builder.query({
      query: (mallId) => `/parking/stats/${mallId}`,
      providesTags: ['Parking'],
    }),
    initParkingPayment: builder.mutation({
      query: (data) => ({
        url: '/parking/payment/init',
        method: 'POST',
        body: data,
      }),
    }),
    getMyParkingHistory: builder.query({
      query: () => '/parking/my-history',
      providesTags: ['Parking'],
    }),
  }),
});

export const {
  useGetParkingStatusQuery,
  useGetParkingStatsQuery,
  useRecordEntryMutation,
  useRecordExitMutation,
  useInitParkingPaymentMutation,
  useGetMyParkingHistoryQuery,
} = parkingApiSlice;
