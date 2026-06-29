import { apiSlice } from '../api/apiSlice';

export const offerApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOffers: builder.query({
      query: (category) => ({
        url: '/offers',
        params: { category },
      }),
      providesTags: ['Offer'],
    }),
    getOffersByMall: builder.query({
      query: (mallId) => ({
        url: '/offers',
        params: { mall: mallId, status: 'all' },
      }),
      providesTags: ['Offer'],
    }),
    getOffersByShop: builder.query({
      query: (shopId) => ({
        url: '/offers',
        params: { shop: shopId, status: 'all' },
      }),
      providesTags: ['Offer'],
    }),
    createOffer: builder.mutation({
      query: (data) => ({
        url: '/offers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Offer'],
    }),
    updateOffer: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/offers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Offer'],
    }),
    deleteOffer: builder.mutation({
      query: (id) => ({
        url: `/offers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Offer'],
    }),
  }),
});

export const { 
  useGetOffersQuery,
  useGetOffersByMallQuery,
  useGetOffersByShopQuery,
  useCreateOfferMutation, 
  useUpdateOfferMutation, 
  useDeleteOfferMutation 
} = offerApiSlice;
