"use client";

import Image from "next/image";
import { Mail, MessageSquare } from "lucide-react";
import { ContactFormContent } from "./ContactFormContent";

export function ContactSection() {
  return (
    <section id="contact" className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background glow blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[400px] bg-[#b57e04]/5 dark:bg-[#b57e04]/7 rounded-full blur-[90px]" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[300px] bg-[#f0c040]/4 dark:bg-[#f0c040]/5 rounded-full blur-[70px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 border border-[#b57e04]/40 bg-[#b57e04]/8 dark:bg-[#b57e04]/10 rounded-full px-4 py-1.5 mb-5">
            <MessageSquare className="w-3.5 h-3.5 text-[#b57e04]" />
            <span className="text-[#b57e04] text-sm font-ui font-medium">Get in touch</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Contact Us
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto font-ui">
            Have a question, partnership idea, or just want to say hello? We&apos;d love to hear from you.
          </p>
          <div className="mx-auto mt-5 h-[2px] w-16 rounded-full bg-gradient-to-r from-[#b57e04] to-[#f0c040]" />
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Left – mascot image + contact info */}
          <div className="flex flex-col gap-6">
            {/* Mascot with gold afterglow */}
            <div className="relative flex items-center justify-center h-[280px] sm:h-[360px]">
              {/* Gold radial glow behind image */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] rounded-full bg-[#b57e04]/20 dark:bg-[#b57e04]/25 blur-[60px]" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] rounded-full bg-[#f0c040]/15 dark:bg-[#f0c040]/20 blur-[30px]" />
              </div>

              {/* Light mode image */}
              <Image
                src="/images/actmyagent-contact-us.png"
                alt="ActMyAgent contact"
                width={320}
                height={320}
                className="relative drop-shadow-[0_8px_32px_rgba(181,126,4,0.22)] select-none block dark:hidden object-contain h-full w-auto"
              />
              {/* Dark mode image */}
              <Image
                src="/images/actmyagent-contact-us-dark.png"
                alt="ActMyAgent contact"
                width={320}
                height={320}
                className="relative drop-shadow-[0_8px_40px_rgba(212,160,23,0.35)] select-none hidden dark:block object-contain h-full w-auto"
              />
            </div>

            {/* Contact info cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="gradient-border-card bg-card rounded-xl p-5 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#b57e04]/10 shrink-0">
                  <Mail className="w-4 h-4 text-[#b57e04]" />
                </div>
                <div>
                  <p className="text-foreground font-ui font-medium text-sm mb-0.5">Email us</p>
                  <p className="text-muted-foreground font-ui text-xs">hello@actmyagent.com</p>
                </div>
              </div>
              <div className="gradient-border-card bg-card rounded-xl p-5 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#b57e04]/10 shrink-0">
                  <MessageSquare className="w-4 h-4 text-[#b57e04]" />
                </div>
                <div>
                  <p className="text-foreground font-ui font-medium text-sm mb-0.5">Response time</p>
                  <p className="text-muted-foreground font-ui text-xs">Usually within 24 hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right – Form */}
          <div className="gradient-border-card bg-card rounded-2xl shadow-sm p-7">
            <h3 className="font-display text-xl font-semibold text-foreground mb-1">
              Send us a message
            </h3>
            <p className="text-muted-foreground font-ui text-sm mb-6">
              Fill in the form and we&apos;ll get back to you shortly.
            </p>
            <ContactFormContent />
          </div>
        </div>
      </div>
    </section>
  );
}
