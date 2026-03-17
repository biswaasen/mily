const reviews = [
  {
    name: "Priya Sharma",
    role: "Product Manager",
    company: "Bangalore",
    avatar: "PS",
    color: "bg-rose-100 text-rose-700",
    quote: "I take notes during every standup. Before Mily, I'd type and miss half of what was said. Now I just speak and my notes are formatted perfectly. Game changer for async teams.",
    stars: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Sales Lead",
    company: "Austin, TX",
    avatar: "MJ",
    color: "bg-sky-100 text-sky-700",
    quote: "I close deals over the phone and used to lose details between calls. With Mily I just speak my follow-up notes right after — they land in my CRM clean and structured. Nothing slips.",
    stars: 5,
  },
  {
    name: "Arjun Patel",
    role: "Software Engineer",
    company: "Mumbai",
    avatar: "AP",
    color: "bg-amber-100 text-amber-700",
    quote: "The self-correction feature is wild. I'll say something, catch myself, say 'no wait' and the corrected version is what gets typed. It's like it reads my mind.",
    stars: 5,
  },
  {
    name: "Emily Chen",
    role: "Content Strategist",
    company: "New York, NY",
    avatar: "EC",
    color: "bg-purple-100 text-purple-700",
    quote: "I write 3,000 words a day. My hands were starting to hurt. Mily lets me dictate everything — even code comments and email replies. My wrists are grateful.",
    stars: 5,
  },
  {
    name: "Rohan Desai",
    role: "Founder",
    company: "Pune",
    avatar: "RD",
    color: "bg-green-100 text-green-700",
    quote: "I was skeptical — I've tried five voice tools and they all annoyed me. Mily actually works. No training, no setup, just install and go. It pastes right where my cursor is. Finally.",
    stars: 5,
  },
  {
    name: "Sarah Mitchell",
    role: "Lawyer",
    company: "Chicago, IL",
    avatar: "SM",
    color: "bg-orange-100 text-orange-700",
    quote: "I dictate case notes, client memos, and draft emails entirely by voice now. The accuracy with legal terminology surprised me. It even picks up Latin phrases correctly.",
    stars: 5,
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className="w-4 h-4 text-neutral-900 fill-neutral-900" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section id="reviews" className="py-28 bg-neutral-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-garamond font-medium text-neutral-900 tracking-tight mb-4">
            People who've stopped typing
          </h2>
          <p className="text-lg font-garamond text-neutral-500">
            From Mumbai to Manhattan — Mily works for everyone.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map(({ name, role, company, avatar, color, quote, stars }) => (
            <div
              key={name}
              className="bg-white rounded-2xl border border-neutral-200 p-7 flex flex-col gap-5 hover:shadow-md hover:border-neutral-300 transition-all"
            >
              <Stars count={stars} />
              <p className="font-garamond text-neutral-700 text-base leading-relaxed flex-1">
                &ldquo;{quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-neutral-100">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${color}`}>
                  {avatar}
                </div>
                <div>
                  <p className="text-sm font-garamond font-semibold text-neutral-900">{name}</p>
                  <p className="text-xs font-garamond text-neutral-500">{role} · {company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
