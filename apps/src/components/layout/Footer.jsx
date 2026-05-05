const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="fixed bottom-0 left-64 right-0 h-12 bg-white border-t flex items-center justify-center z-30">
      <p className="text-xs text-gray-400">
        © {currentYear} DocVerify - Blockchain Degree Verification
      </p>
    </footer>
  );
};

export default Footer;
