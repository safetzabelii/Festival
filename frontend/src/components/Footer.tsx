import Link from 'next/link';
import { FaGithub, FaInstagram, FaTwitter, FaFacebook } from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black/60 backdrop-blur-md border-t border-[#FF7A00]/20 py-8 text-[#FFB4A2]/80 lowercase mt-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and About */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FF7A00] via-[#FFD600] to-[#FF3366] text-transparent bg-clip-text">festival</h2>
            <p className="text-sm">discover and share your favorite events and festivals around the world.</p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#FFD600]">navigation</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-[#FFD600] transition-colors duration-300">home</Link></li>
              <li><Link href="/festivals" className="hover:text-[#FFD600] transition-colors duration-300">festivals</Link></li>
              <li><Link href="/discussions" className="hover:text-[#FFD600] transition-colors duration-300">discussions</Link></li>
              <li><Link href="/login" className="hover:text-[#FFD600] transition-colors duration-300">login</Link></li>
              <li><Link href="/register" className="hover:text-[#FFD600] transition-colors duration-300">register</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#FFD600]">resources</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="hover:text-[#FFD600] transition-colors duration-300">about us</Link></li>
              <li><Link href="/privacy" className="hover:text-[#FFD600] transition-colors duration-300">privacy policy</Link></li>
              <li><Link href="/terms" className="hover:text-[#FFD600] transition-colors duration-300">terms of service</Link></li>
              <li><Link href="/contact" className="hover:text-[#FFD600] transition-colors duration-300">contact us</Link></li>
            </ul>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#FFD600]">follow us</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-[#FFB4A2] hover:text-[#FF7A00] transition-colors duration-300 hover:scale-110 transform">
                <FaTwitter size={20} />
              </a>
              <a href="#" className="text-[#FFB4A2] hover:text-[#FF7A00] transition-colors duration-300 hover:scale-110 transform">
                <FaInstagram size={20} />
              </a>
              <a href="#" className="text-[#FFB4A2] hover:text-[#FF7A00] transition-colors duration-300 hover:scale-110 transform">
                <FaFacebook size={20} />
              </a>
              <a href="#" className="text-[#FFB4A2] hover:text-[#FF7A00] transition-colors duration-300 hover:scale-110 transform">
                <FaGithub size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom / Copyright */}
        <div className="mt-8 pt-4 border-t border-[#FF7A00]/20 text-center text-xs text-[#FFB4A2]/60">
          <p>© {currentYear} festival app. all rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 