import { apiSlice } from '../api/apiSlice';

export const productApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProductsByShop: builder.query({
      query: (shopId) => `/products/shop/${shopId}`,
      providesTags: ['Product'],
    }),
    getProductsByMall: builder.query({
      query: (mallId) => ({
        url: '/products',
        params: { mall: mallId },
      }),
      providesTags: ['Product'],
    }),
    getProducts: builder.query({
      query: (keyword) => ({
        url: '/products',
        params: { keyword },
      }),
      providesTags: ['Product'],
    }),
    getProductDetails: builder.query({
      query: (productId) => `/products/${productId}`,
      providesTags: ['Product'],
    }),
    createProduct: builder.mutation({
      query: (data) => ({
        url: '/products',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Product'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Product'],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product'],
    }),
  }),
});

export const { 
  useGetProductsByShopQuery,
  useGetProductsByMallQuery,
  useCreateProductMutation,
  useGetProductsQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetProductDetailsQuery
} = productApiSlice;
