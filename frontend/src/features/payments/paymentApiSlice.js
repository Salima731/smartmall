import { apiSlice } from '../api/apiSlice';

export const paymentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation({
      query: (data) => ({
        url: '/payments/order',
        method: 'POST',
        body: data,
      }),
    }),
    verifyPayment: builder.mutation({
      query: (data) => ({
        url: '/payments/verify',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const { useCreateOrderMutation, useVerifyPaymentMutation } = paymentApiSlice;
