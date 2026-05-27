const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="h-14 bg-white border-t border-gray-200/60 flex items-center justify-center shrink-0">
      <p className="text-xs text-gray-400">
        © {currentYear} DocVerify — Hệ thống xác thực văn bằng Blockchain
      </p>
    </footer>
  );
};

export default Footer;
