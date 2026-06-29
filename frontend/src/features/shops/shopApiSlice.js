import { apiSlice } from '../api/apiSlice';

export const shopApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getShopsByMall: builder.query({
      query: (mallId) => `/shops/mall/${mallId}`,
      providesTags: ['Shop'],
    }),
    globalSearch: builder.query({
      query: (keyword) => ({
        url: '/shops/search',
        params: { keyword },
      }),
    }),
    getShops: builder.query({
      query: (keyword) => ({
        url: '/shops',
        params: { keyword },
      }),
      providesTags: ['Shop'],
    }),
    getManagedShops: builder.query({
      query: (keyword) => ({
        url: '/shops/managed',
        params: { keyword },
      }),
      providesTags: ['Shop'],
    }),
    getMyShop: builder.query({
      query: () => '/shops/my-shop',
      providesTags: ['Shop'],
    }),
    getShopById: builder.query({
      query: (id) => `/shops/${id}`,
      providesTags: ['Shop'],
    }),
    createShop: builder.mutation({
      query: (data) => ({
        url: '/shops',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Shop', 'User'],
    }),
    updateShop: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/shops/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Shop', 'User'],
    }),
    deleteShop: builder.mutation({
      query: (id) => ({
        url: `/shops/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Shop', 'User'],
    }),
  }),
});

export const { 
  useGetShopsByMallQuery, 
  useGetManagedShopsQuery,
  useGetMyShopQuery,
  useGlobalSearchQuery, 
  useCreateShopMutation, 
  useGetShopsQuery, 
  useUpdateShopMutation, 
  useGetShopByIdQuery,
  useDeleteShopMutation
} = shopApiSlice;
