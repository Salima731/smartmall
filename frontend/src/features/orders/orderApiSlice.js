import { apiSlice } from '../api/apiSlice';

const isValidParam = (value) => (
  value !== undefined &&
  value !== null &&
  value !== '' &&
  value !== 'null' &&
  value !== 'undefined'
);

export const orderApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    placeOrder: builder.mutation({
      query: (data) => ({ url: '/orders', method: 'POST', body: data }),
      invalidatesTags: ['Order'],
    }),
    confirmPayment: builder.mutation({
      query: (id) => ({ url: `/orders/${id}/pay`, method: 'PUT' }),
      invalidatesTags: ['Order'],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, orderStatus }) => ({ url: `/orders/${id}/status`, method: 'PUT', body: { orderStatus } }),
      invalidatesTags: ['Order'],
    }),
    cancelOrder: builder.mutation({
      query: (id) => ({ url: `/orders/${id}/cancel`, method: 'PUT' }),
      invalidatesTags: ['Order'],
    }),
    getMyOrders: builder.query({
      query: () => '/orders/my',
      providesTags: ['Order'],
    }),
    getShopOrders: builder.query({
      query: ({ shopId, status } = {}) => ({
        url: '/orders/shop',
        params: {
          ...(isValidParam(shopId) ? { shopId } : {}),
          ...(isValidParam(status) ? { status } : {}),
        },
      }),
      providesTags: ['Order'],
    }),
    getOrderById: builder.query({
      query: (id) => `/orders/${id}`,
      providesTags: ['Order'],
    }),
  }),
});

export const {
  usePlaceOrderMutation,
  useConfirmPaymentMutation,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
  useGetMyOrdersQuery,
  useGetShopOrdersQuery,
  useGetOrderByIdQuery,
} = orderApiSlice;
