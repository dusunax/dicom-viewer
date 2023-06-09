module.exports = {
  module: {
    rules: [
      {
        test: /\.dcm$/, // 로더를 적용할 파일 유형
        exclude: /(node_modules|bower_components)/,
        use: {
          // 해당 파일에 적용할 로더의 이름
          loader: "file-loader",
        },
      },
      {
        test: /\.svg$/,
        use: "file-loader",
      },
    ],
  },
  resolve: {
    alias: {
      "@cornerstonejs/dicom-image-loader":
        "@cornerstonejs/dicom-image-loader/dist/dynamic-import/cornerstoneDICOMImageLoader.min.js",
    },
  },
};
