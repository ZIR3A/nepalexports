import { motion } from "motion/react";
import { ArrowRight, Zap, Shield, Globe, Award } from "lucide-react";
import { Button } from "../ui/button";

export default function AboutPage({ setPage }) {
  const milestones = [
    { year: "2020", title: "The Idea", desc: "Founded in Kathmandu, Nepal with a vision to create premium fashion that tells a story." },
    { year: "2022", title: "First Collection", desc: "Launched our debut collection of 12 hand-crafted tees. Sold out in 48 hours." },
    { year: "2023", title: "London Expansion", desc: "Opened our London operations to serve the growing UK and European market." },
    { year: "2024", title: "Going Global", desc: "Shipping to 25+ countries with over 10,000 happy customers worldwide." },
    { year: "2025", title: "New Horizons", desc: "Expanding to new product categories while staying true to our premium roots." },
  ];

  return (
    <div className="pt-[72px] min-h-screen">
      {/* Hero */}
      <div className="relative h-[70vh] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=1800&h=1000&fit=crop&auto=format"
          alt="Brand story"
          className="w-full h-full object-cover bg-muted"
        />
        <div className="absolute inset-0 bg-background/60" />
        <div className="absolute inset-0 flex items-end pb-20">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <span className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">Our Story</span>
              <h1 className="font-display text-6xl lg:text-8xl font-light mt-4 max-w-2xl leading-tight">
                Crafted with<br />purpose
              </h1>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mission */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="font-display text-4xl font-light mb-6">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We believe fashion should be more than just clothing. It should be a statement — of your values, your story, and your connection to something larger than yourself.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              DRAPE was born from the intersection of two cultures: the rich textile heritage of Nepal and the sharp, modern sensibility of London. We honour both.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Every piece we create is ethically made, built to last, and designed to make you feel something when you put it on.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Zap, title: "Ethically Made", desc: "Fair wages, safe conditions, local artisans" },
              { icon: Shield, title: "Quality First", desc: "220gsm+ fabrics, rigorous testing" },
              { icon: Globe, title: "Two Cultures", desc: "Nepal heritage, London design" },
              { icon: Award, title: "Carbon Neutral", desc: "Offset shipping, sustainable packaging" },
            ].map(v => (
              <div key={v.title} className="border border-border p-5">
                <v.icon size={20} className="text-accent mb-3" />
                <p className="font-medium text-foreground text-sm">{v.title}</p>
                <p className="text-muted-foreground text-xs mt-1">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-card border-y border-border py-24">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <h2 className="font-display text-4xl font-light mb-12">Our Journey</h2>
          <div className="space-y-0">
            {milestones.map((m, i) => (
              <div key={m.year} className="flex gap-8 relative">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 border border-accent bg-background flex items-center justify-center z-10">
                    <span className="font-mono text-[10px] text-accent">{m.year.slice(2)}</span>
                  </div>
                  {i < milestones.length - 1 && (
                    <div className="w-px flex-1 bg-border my-2" style={{ minHeight: "3rem" }} />
                  )}
                </div>
                <div className="pb-10 flex-1 pt-1.5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-[11px] text-accent">{m.year}</span>
                    <h3 className="font-medium text-foreground">{m.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-24 text-center">
        <h2 className="font-display text-4xl font-light mb-4">Ready to wear the uncommon?</h2>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Join thousands of customers who choose DRAPE for quality, ethics, and style.</p>
        <Button variant="default" size="lg" onClick={() => setPage("shop")}>
          Shop the Collection <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
