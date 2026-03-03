'use client';

import Link from 'next/link';
import { MapPin, Phone, Mail, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ background: '#020b06', borderTop: '1px solid rgba(52,211,153,0.1)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#34d399,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontWeight: 800, fontSize: 13 }}>AK</span>
              </div>
              <span style={{ fontWeight: 800, fontSize: 20, color: 'white' }}>
                Animal<span style={{ color: '#34d399' }}>Kart</span>
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.65 }}>
              India&apos;s premier livestock investment platform. Invest in premium buffalo and calf units across Andhra Pradesh.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <a href="https://wa.me/919876543210" style={{ width: 34, height: 34, background: 'rgba(52,211,153,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399', transition: 'all 0.2s' }}>
                <MessageCircle size={15} />
              </a>
              <a href="mailto:support@animalkart.com" style={{ width: 34, height: 34, background: 'rgba(96,165,250,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(96,165,250,0.2)', color: '#93c5fd', transition: 'all 0.2s' }}>
                <Mail size={15} />
              </a>
              <a href="tel:+919876543210" style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}>
                <Phone size={15} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 style={{ fontWeight: 600, color: '#34d399', fontSize: 13, marginBottom: 16 }}>Quick Links</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['/#how-it-works', 'How it Works'],
                ['/#warehouses', 'Warehouses'],
                ['/#rewards', 'Rewards'],
                ['/auth/register', 'Register'],
                ['/auth/login', 'Login'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#34d399'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Farms */}
          <div>
            <h3 style={{ fontWeight: 600, color: '#34d399', fontSize: 13, marginBottom: 16 }}>Our Farms</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Kurnool', 'Vijayawada', 'Guntur', 'Kakinada'].map(city => (
                <li key={city} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={12} style={{ color: '#34d399', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{city}, Andhra Pradesh</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 style={{ fontWeight: 600, color: '#34d399', fontSize: 13, marginBottom: 16 }}>Contact Us</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <MapPin size={14} style={{ color: '#34d399', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>AnimalKart Pvt. Ltd., Hyderabad, Telangana 500001</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={14} style={{ color: '#34d399', flexShrink: 0 }} />
                <a href="tel:+919876543210" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.2s' }}>+91 98765 43210</a>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={14} style={{ color: '#34d399', flexShrink: 0 }} />
                <a href="mailto:support@animalkart.com" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.2s' }}>support@animalkart.com</a>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageCircle size={14} style={{ color: '#34d399', flexShrink: 0 }} />
                <a href="https://wa.me/919876543210" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.2s' }}>WhatsApp Support</a>
              </li>
            </ul>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 40, paddingTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[['#', 'Privacy Policy'], ['#', 'Terms & Conditions'], ['#', 'Refund Policy']].map(([href, label]) => (
              <Link key={label} href={href} style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', textDecoration: 'none', transition: 'color 0.2s' }}>{label}</Link>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)', textAlign: 'center' }}>
            © 2026 AnimalKart Pvt. Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
