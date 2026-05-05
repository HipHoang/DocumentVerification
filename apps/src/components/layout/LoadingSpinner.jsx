import React from 'react';

const LoadingSpinner = ({ message = "Đang kết nối hệ thống Blockchain..." }) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
      <div className="relative">
        {/* Vòng xoay chính */}
        <div className="h-20 w-20 rounded-full border-t-4 border-b-4 border-indigo-600 animate-spin"></div>
        {/* Vòng trang trí mờ */}
        <div className="absolute top-0 left-0 h-20 w-20 rounded-full border-4 border-indigo-100 opacity-20"></div>
      </div>
      <h2 className="mt-6 text-xl font-bold text-gray-900 tracking-tight">CertChain System</h2>
      <p className="mt-2 text-gray-500 font-medium animate-pulse">{message}</p>
    </div>
  );
};

export default LoadingSpinner;