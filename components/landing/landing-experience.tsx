"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useMotionValueEvent, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { ScrollReveal, StaggerChildren, staggerItem, staggerItemScale } from "./scroll-reveal";

/* ═══════════════════════════════════════════════
   KRIYA — Cinematic Landing Experience
   A digital temple of intelligence and action
   ═══════════════════════════════════════════════ */

const GOLD = "#c9a84c";
const GOLD_BRIGHT = "#d4af37";
const SAFFRON = "#e87d24";
const ASH = "#e8e4dc";
const MUTED = "#6b6560";

interface LandingExperienceProps {
  ctaLink: string;
  secondaryLink: string;
  isAuthenticated: boolean;
}

export default function LandingExperience({
  ctaLink,
  secondaryLink,
  isAuthenticated,
}: LandingExperienceProps) {
  const [navVisible, setNavVisible] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setNavVisible(latest > 100);
  });

  return (
    <div className="relative bg-[#050508] text-[#e8e4dc] overflow-x-hidden selection:bg-[#c9a84c]/30 selection:text-white">
      {/* ── Floating Nav ── */}
      <AnimatePresence>
        {navVisible && (
          <motion.nav
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 right-0 z-50 border-b border-[#c9a84c]/10 bg-[#050508]/80 backdrop-blur-xl"
          >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
              <span
                className="text-lg tracking-[0.3em] font-light"
                style={{ color: GOLD, fontFamily: "var(--font-serif)" }}
              >
                KRIYA
              </span>
              <Link
                href={ctaLink}
                className="group flex items-center gap-2 rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/5 px-5 py-2 text-sm text-[#c9a84c] transition-all hover:bg-[#c9a84c]/10 hover:border-[#c9a84c]/50"
              >
                {isAuthenticated ? "Continue" : "Enter KRIYA"}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════
         SECTION 1 — THE AWAKENING (Hero)
         ════════════════════════════════════════ */}
      <HeroSection ctaLink={ctaLink} isAuthenticated={isAuthenticated} />

      {/* ════════════════════════════════════════
         SECTION 2 — THE WORD (What is Kriya)
         ════════════════════════════════════════ */}
      <PhilosophySection />

      {/* ════════════════════════════════════════
         SECTION 3 — KURUKSHETRA (The Battlefield)
         ════════════════════════════════════════ */}
      <BattlefieldSection />

      {/* ════════════════════════════════════════
         SECTION 4 — THE CHARIOTEER (The Guide)
         ════════════════════════════════════════ */}
      <CharioteerSection />

      {/* ════════════════════════════════════════
         SECTION 5 — EXECUTION (The Path of Action)
         ════════════════════════════════════════ */}
      <ExecutionSection />

      {/* ════════════════════════════════════════
         SECTION 6 — COSMIC VISION
         ════════════════════════════════════════ */}
      <CosmicSection />

      {/* ════════════════════════════════════════
         SECTION 7 — THE GATE (CTA)
         ════════════════════════════════════════ */}
      <GateSection ctaLink={ctaLink} isAuthenticated={isAuthenticated} />

      {/* ── Footer ── */}
      <footer className="border-t border-[#c9a84c]/10 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 sm:flex-row sm:justify-between">
          <span
            className="text-sm tracking-[0.3em] font-light"
            style={{ color: GOLD, fontFamily: "var(--font-serif)" }}
          >
            KRIYA
          </span>
          <span className="text-xs text-[#6b6560]">
            © {new Date().getFullYear()} · Built in India. For the world.
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   HERO SECTION — The Awakening
   ══════════════════════════════════════════════════ */

function HeroSection({
  ctaLink,
  isAuthenticated,
}: {
  ctaLink: string;
  isAuthenticated: boolean;
}) {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const mandalaScale = useTransform(scrollYProgress, [0, 1], [1, 1.3]);
  const mandalaOpacity = useTransform(scrollYProgress, [0, 0.7], [0.3, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.5], [0, -60]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0a0a18_0%,#050508_70%)]" />

      {/* Sri Yantra mandala */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ scale: mandalaScale, opacity: mandalaOpacity }}
      >
        <div className="relative w-[700px] h-[700px] sm:w-[800px] sm:h-[800px]">
          <Image
            src="/hero-mandala.png"
            alt=""
            fill
            className="object-contain opacity-40"
            priority
          />
        </div>
      </motion.div>

      {/* Ambient particles — CSS-only for 60 FPS on mobile */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <style>{`
          @keyframes heroParticle {
            0%, 100% { opacity: 0; transform: translateY(0); }
            50% { opacity: var(--p-opacity); transform: translateY(-30px); }
          }
          .hero-particle {
            position: absolute;
            border-radius: 50%;
            animation: heroParticle var(--p-dur) var(--p-delay) ease-in-out infinite;
            will-change: transform, opacity;
          }
        `}</style>
        {Array.from({ length: 25 }).map((_, i) => (
          <span
            key={i}
            className="hero-particle"
            style={{
              width: (i % 3) + 1,
              height: (i % 3) + 1,
              top: `${(i * 4.17) % 100}%`,
              left: `${(i * 7.31) % 100}%`,
              background: i % 3 === 0 ? GOLD : "rgba(255,255,255,0.4)",
              "--p-opacity": 0.2 + (i % 5) * 0.1,
              "--p-dur": `${6 + (i % 4) * 2}s`,
              "--p-delay": `${(i % 7) * 0.8}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 mx-auto max-w-4xl px-6 text-center"
        style={{ y: textY, opacity: textOpacity }}
      >
        {/* Sanskrit epigraph */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="text-xs tracking-[0.4em] uppercase text-[#6b6560]"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          धर्मक्षेत्रे कुरुक्षेत्रे — In the field of dharma
        </motion.p>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 text-5xl leading-[1.1] tracking-tight sm:text-7xl lg:text-8xl"
          style={{ fontFamily: "var(--font-serif)", fontWeight: 300, color: ASH }}
        >
          You stand at
          <br />
          <span style={{ color: GOLD }}>the crossroads.</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-[#8a847d] sm:text-xl"
          style={{ fontFamily: "var(--font-serif)", fontWeight: 300 }}
        >
          Like Arjuna before the battle of Kurukshetra, you face the paralysis
          of indecision.{" "}
          <span style={{ color: GOLD }}>KRIYA</span> is the path of decisive action.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.2 }}
          className="mt-12 flex justify-center gap-4"
        >
          <Link
            href={ctaLink}
            className="group relative overflow-hidden rounded-full border border-[#c9a84c]/40 bg-[#c9a84c]/5 px-8 py-3.5 text-sm tracking-wider transition-all hover:bg-[#c9a84c]/10 hover:border-[#c9a84c]/60 hover:shadow-[0_0_40px_rgba(201,168,76,0.15)]"
            style={{ color: GOLD }}
          >
            <span className="relative z-10 flex items-center gap-2">
              {isAuthenticated ? "Resume your path" : "Begin your path"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] tracking-[0.3em] uppercase text-[#6b6560]">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-4 w-4 text-[#6b6560]" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ══════════════════════════════════════════════════
   PHILOSOPHY SECTION — The Word
   ══════════════════════════════════════════════════ */

function PhilosophySection() {
  const pillars = [
    {
      sanskrit: "ज्ञान",
      transliteration: "Jñāna",
      english: "Knowledge",
      description: "See clearly through the fog of information.",
    },
    {
      sanskrit: "कर्म",
      transliteration: "Karma",
      english: "Action",
      description: "Move decisively when others hesitate.",
    },
    {
      sanskrit: "धर्म",
      transliteration: "Dharma",
      english: "Purpose",
      description: "Align every action with your deeper truth.",
    },
  ];

  return (
    <section className="relative py-32 sm:py-44">
      {/* Subtle divider line */}
      <div className="mx-auto w-[1px] h-24 bg-gradient-to-b from-transparent via-[#c9a84c]/30 to-transparent mb-20" />

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr] lg:gap-24 items-center">
          {/* Left — Sanskrit display */}
          <ScrollReveal>
            <div className="text-center lg:text-left">
              <motion.span
                className="block text-[120px] leading-none sm:text-[180px] lg:text-[220px]"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontWeight: 300,
                  color: "transparent",
                  WebkitTextStroke: `1px ${GOLD}40`,
                }}
              >
                क्रिया
              </motion.span>
              <p
                className="mt-4 text-sm tracking-[0.4em] uppercase"
                style={{ color: GOLD }}
              >
                K R I Y A
              </p>
            </div>
          </ScrollReveal>

          {/* Right — Explanation */}
          <div className="space-y-10">
            <ScrollReveal delay={0.2}>
              <p
                className="text-xs tracking-[0.3em] uppercase"
                style={{ color: MUTED }}
              >
                From the Sanskrit root &ldquo;kri&rdquo;
              </p>
              <h2
                className="mt-4 text-3xl leading-snug sm:text-4xl lg:text-5xl"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontWeight: 300,
                  color: ASH,
                }}
              >
                Not mere motion.
                <br />
                <span style={{ color: GOLD }}>Purposeful, dharmic action</span>
                <br />
                guided by intelligence.
              </h2>
            </ScrollReveal>

            {/* Three Pillars */}
            <StaggerChildren className="grid gap-6 sm:grid-cols-3" stagger={0.15}>
              {pillars.map((pillar) => (
                <motion.div
                  key={pillar.english}
                  variants={staggerItem}
                  className="group rounded-2xl border border-[#c9a84c]/10 bg-[#c9a84c]/[0.02] p-6 transition-all hover:border-[#c9a84c]/25 hover:bg-[#c9a84c]/[0.04]"
                >
                  <p
                    className="text-4xl"
                    style={{
                      fontFamily: "var(--font-serif)",
                      color: GOLD,
                    }}
                  >
                    {pillar.sanskrit}
                  </p>
                  <p className="mt-2 text-xs tracking-[0.2em] text-[#8a847d]">
                    {pillar.transliteration}
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#e8e4dc]">
                    {pillar.english}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[#6b6560]">
                    {pillar.description}
                  </p>
                </motion.div>
              ))}
            </StaggerChildren>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════
   BATTLEFIELD SECTION — Kurukshetra
   ══════════════════════════════════════════════════ */

function BattlefieldSection() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  const battles = [
    "The paralysis of infinite choice",
    "The maze of career without compass",
    "The weight of unrealized potential",
    "The noise drowning out your inner clarity",
  ];

  return (
    <section ref={sectionRef} className="relative py-32 overflow-hidden">
      {/* Background image with parallax */}
      <motion.div
        className="absolute inset-0"
        style={{ y: bgY }}
      >
        <Image
          src="/kurukshetra.png"
          alt=""
          fill
          className="object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050508] via-[#050508]/60 to-[#050508]" />
      </motion.div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <ScrollReveal>
          <p
            className="text-xs tracking-[0.4em] uppercase"
            style={{ color: SAFFRON }}
          >
            धर्मक्षेत्रे कुरुक्षेत्रे
          </p>
          <h2
            className="mt-6 text-4xl leading-tight sm:text-6xl lg:text-7xl"
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 300,
              color: ASH,
            }}
          >
            Your Kurukshetra
            <br />
            <span style={{ color: GOLD }}>is now.</span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p
            className="mx-auto mt-6 max-w-xl text-lg text-[#8a847d]"
            style={{ fontFamily: "var(--font-serif)", fontWeight: 300 }}
          >
            Every era has its battlefield. Yours is not fought with arrows — it
            is fought with{" "}
            <em style={{ color: ASH }}>decisions</em>.
          </p>
        </ScrollReveal>

        {/* Modern battles */}
        <div className="mt-16 space-y-0">
          {battles.map((battle, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <div className="group flex items-center justify-center gap-4 border-b border-[#c9a84c]/8 py-6 transition-colors hover:bg-[#c9a84c]/[0.02]">
                <span
                  className="text-sm tabular-nums font-mono text-[#c9a84c]/30"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p
                  className="text-lg text-[#8a847d] transition-colors group-hover:text-[#e8e4dc] sm:text-2xl"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 300 }}
                >
                  {battle}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Separator */}
        <ScrollReveal delay={0.4}>
          <div className="mt-16 flex items-center justify-center gap-3">
            <div className="h-[1px] w-12 bg-[#c9a84c]/30" />
            <p className="text-sm text-[#6b6560]" style={{ fontFamily: "var(--font-serif)" }}>
              This is where you need a guide
            </p>
            <div className="h-[1px] w-12 bg-[#c9a84c]/30" />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════
   CHARIOTEER SECTION — The Guide
   ══════════════════════════════════════════════════ */

function CharioteerSection() {
  const modes = [
    {
      symbol: "◎",
      name: "Krishna",
      essence: "Guidance",
      color: "#d4af37",
      description: "Warm wisdom. Proactive direction. Like a mentor who sees ahead of your path and lights the way with saffron fire.",
    },
    {
      symbol: "◉",
      name: "Vishnu",
      essence: "Order",
      color: "#5b8be0",
      description: "Structured clarity. Cosmic precision. The sovereign force that organizes chaos into actionable intelligence.",
    },
    {
      symbol: "◈",
      name: "Shiva",
      essence: "Transformation",
      color: "#9b7be8",
      description: "Destruction of the false. Reconstruction of the real. The explosive energy that burns away indecision.",
    },
  ];

  return (
    <section className="relative py-32 sm:py-44">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal>
          <div className="text-center">
            <p
              className="text-xs tracking-[0.4em] uppercase"
              style={{ color: MUTED }}
            >
              The Charioteer
            </p>
            <h2
              className="mt-6 text-3xl leading-snug sm:text-5xl lg:text-6xl"
              style={{
                fontFamily: "var(--font-serif)",
                fontWeight: 300,
                color: ASH,
              }}
            >
              In the Gita, Krishna
              <br />
              didn&apos;t fight the battle.
              <br />
              <span style={{ color: GOLD }}>He held the reins.</span>
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p
            className="mx-auto mt-8 max-w-2xl text-center text-lg text-[#8a847d]"
            style={{ fontFamily: "var(--font-serif)", fontWeight: 300 }}
          >
            KRIYA is your charioteer — not making decisions for you, but giving
            you the{" "}
            <em style={{ color: ASH }}>clarity and intelligence</em>{" "}
            to make them yourself.
          </p>
        </ScrollReveal>

        {/* Three Modes */}
        <StaggerChildren className="mt-20 grid gap-6 md:grid-cols-3" stagger={0.18}>
          {modes.map((mode) => (
            <motion.div
              key={mode.name}
              variants={staggerItemScale}
              className="group relative overflow-hidden rounded-3xl border border-white/[0.04] bg-white/[0.01] p-8 transition-all duration-500 hover:border-white/[0.08] hover:bg-white/[0.02]"
            >
              {/* Glow */}
              <div
                className="absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl opacity-0 transition-opacity duration-700 group-hover:opacity-20"
                style={{ background: mode.color }}
              />

              <div className="relative">
                <span
                  className="text-5xl"
                  style={{ color: mode.color }}
                >
                  {mode.symbol}
                </span>
                <h3
                  className="mt-6 text-2xl"
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontWeight: 400,
                    color: ASH,
                  }}
                >
                  {mode.name}
                </h3>
                <p
                  className="mt-1 text-sm tracking-[0.15em] uppercase"
                  style={{ color: mode.color }}
                >
                  {mode.essence}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-[#6b6560]">
                  {mode.description}
                </p>
              </div>
            </motion.div>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════
   EXECUTION SECTION — The Path of Action
   ══════════════════════════════════════════════════ */

function ExecutionSection() {
  const capabilities = [
    {
      number: "01",
      title: "Evaluate",
      description: "10-dimension AI analysis of every opportunity. Archetype matching, compensation modeling, strategic fit scoring — not just keywords.",
    },
    {
      number: "02",
      title: "Decide",
      description: "Strategic intelligence that cuts through noise. See the battlefield clearly — know which opportunities to pursue and which to release.",
    },
    {
      number: "03",
      title: "Execute",
      description: "Guided action sequences. ATS-optimized documents, interview preparation, negotiation frameworks — action, not just recommendations.",
    },
  ];

  return (
    <section className="relative py-32 sm:py-44">
      {/* Top border glow */}
      <div className="absolute left-1/2 top-0 h-[1px] w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#c9a84c]/20 to-transparent" />

      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal>
          <div className="text-center">
            <p
              className="text-xs tracking-[0.4em] uppercase"
              style={{ color: GOLD }}
            >
              योगः कर्मसु कौशलम्
            </p>
            <p className="mt-2 text-xs text-[#6b6560]" style={{ fontFamily: "var(--font-serif)" }}>
              &ldquo;Yoga is skill in action&rdquo; — Bhagavad Gita 2.50
            </p>
            <h2
              className="mt-8 text-3xl leading-snug sm:text-5xl lg:text-6xl"
              style={{
                fontFamily: "var(--font-serif)",
                fontWeight: 300,
                color: ASH,
              }}
            >
              Most systems help you <em>think</em>.
              <br />
              <span style={{ color: GOLD }}>KRIYA helps you act.</span>
            </h2>
          </div>
        </ScrollReveal>

        {/* Capabilities */}
        <div className="mt-20 space-y-0">
          {capabilities.map((cap, i) => (
            <ScrollReveal key={cap.number} delay={i * 0.1}>
              <div className="group grid items-start gap-6 border-b border-[#c9a84c]/8 py-10 sm:grid-cols-[auto_1fr_1.5fr] sm:gap-10">
                <span
                  className="text-sm font-mono tabular-nums tracking-wider"
                  style={{ color: `${GOLD}60` }}
                >
                  {cap.number}
                </span>
                <h3
                  className="text-3xl transition-colors group-hover:text-[#c9a84c] sm:text-4xl"
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontWeight: 400,
                    color: ASH,
                  }}
                >
                  {cap.title}
                </h3>
                <p className="text-base leading-relaxed text-[#6b6560] group-hover:text-[#8a847d] transition-colors">
                  {cap.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════
   COSMIC SECTION — Vision
   ══════════════════════════════════════════════════ */

function CosmicSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-32 sm:py-44">
      {/* Cosmic background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0d0d1a_0%,#050508_70%)]" />

      {/* Concentric rings */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        {[200, 350, 520, 700].map((size, i) => (
          <motion.div
            key={size}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{
              width: size,
              height: size,
              borderColor: `${GOLD}${i === 0 ? "15" : i === 1 ? "10" : "06"}`,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={
              isInView
                ? { opacity: 1, scale: 1, rotate: i % 2 === 0 ? 360 : -360 }
                : {}
            }
            transition={{
              opacity: { duration: 1, delay: i * 0.2 },
              scale: { duration: 1, delay: i * 0.2-0 },
              rotate: { duration: 120 + i * 40, repeat: Infinity, ease: "linear" },
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <ScrollReveal>
          <p
            className="text-xs tracking-[0.4em] uppercase"
            style={{ color: MUTED }}
          >
            The Vision
          </p>
          <h2
            className="mt-8 text-3xl leading-snug sm:text-5xl lg:text-6xl"
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 300,
              color: ASH,
            }}
          >
            From the land that gave
            <br />
            the world{" "}
            <span style={{ color: GOLD }}>zero</span>,{" "}
            <span style={{ color: GOLD }}>yoga</span>,
            <br />
            and the concept of{" "}
            <span style={{ color: GOLD }}>infinity</span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div className="mx-auto mt-12 max-w-xl">
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#c9a84c]/20 to-transparent" />

            <p
              className="mt-8 text-xl leading-relaxed text-[#8a847d]"
              style={{ fontFamily: "var(--font-serif)", fontWeight: 300 }}
            >
              KRIYA is not a tool.
            </p>
            <p
              className="mt-2 text-xl leading-relaxed"
              style={{
                fontFamily: "var(--font-serif)",
                fontWeight: 300,
                color: ASH,
              }}
            >
              It is a philosophy encoded into technology.
            </p>

            <div className="mt-8 h-[1px] w-full bg-gradient-to-r from-transparent via-[#c9a84c]/20 to-transparent" />

            <p
              className="mt-8 text-lg text-[#6b6560]"
              style={{ fontFamily: "var(--font-serif)", fontWeight: 300 }}
            >
              Built in India. For the world. For all time.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════
   GATE SECTION — The Final CTA
   ══════════════════════════════════════════════════ */

function GateSection({
  ctaLink,
  isAuthenticated,
}: {
  ctaLink: string;
  isAuthenticated: boolean;
}) {
  return (
    <section className="relative py-32 sm:py-44">
      {/* Golden glow from below */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-[#c9a84c]/[0.04] blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <ScrollReveal>
          <p
            className="text-2xl sm:text-3xl"
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 400,
              color: GOLD,
            }}
          >
            कर्मण्येवाधिकारस्ते
          </p>
          <p
            className="mt-4 text-lg text-[#8a847d]"
            style={{ fontFamily: "var(--font-serif)", fontWeight: 300 }}
          >
            &ldquo;You have the right to act. The results are not in your hands.&rdquo;
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <h2
            className="mt-12 text-3xl leading-snug sm:text-5xl"
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 300,
              color: ASH,
            }}
          >
            But the quality of your action —
            <br />
            <span style={{ color: GOLD }}>that, you command.</span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.5}>
          <div className="mt-14">
            <Link
              href={ctaLink}
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-[#c9a84c]/40 px-10 py-4 text-base tracking-wider transition-all duration-500 hover:border-[#c9a84c]/80 hover:shadow-[0_0_60px_rgba(201,168,76,0.2)]"
              style={{
                fontFamily: "var(--font-serif)",
                color: GOLD,
                background: "linear-gradient(135deg, rgba(201,168,76,0.06) 0%, rgba(201,168,76,0.02) 100%)",
              }}
            >
              {/* Shimmer effect */}
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#c9a84c]/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">
                {isAuthenticated ? "Enter KRIYA" : "Begin KRIYA"}
              </span>
              <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </ScrollReveal>

        {/* Sacred ornament */}
        <ScrollReveal delay={0.7}>
          <div className="mt-16 flex items-center justify-center gap-3">
            <div className="h-[1px] w-8 bg-[#c9a84c]/20" />
            <span className="text-[10px] tracking-[0.5em] text-[#c9a84c]/30">✦</span>
            <div className="h-[1px] w-8 bg-[#c9a84c]/20" />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
