export const BOOTH_CATEGORIES = [
  "Academic & Pre-Professional",
  "Arts & Performance",
  "Community Service",
  "Cultural & Identity",
  "Faith & Spirituality",
  "Health & Wellness",
  "Media & Communications",
  "Politics & Advocacy",
  "Social & Recreation",
  "Sports & Competition",
  "STEM & Technology",
  "Other",
] as const;

export type BoothCategory = (typeof BOOTH_CATEGORIES)[number];

export const CATEGORY_COLOR: Record<string, string> = {
  "STEM & Technology":         "#2563EB",
  "Arts & Performance":        "#7C3AED",
  "Community Service":         "#16A34A",
  "Cultural & Identity":       "#EA580C",
  "Faith & Spirituality":      "#D97706",
  "Health & Wellness":         "#0D9488",
  "Media & Communications":    "#DB2777",
  "Politics & Advocacy":       "#DC2626",
  "Social & Recreation":       "#4F46E5",
  "Sports & Competition":      "#059669",
  "Academic & Pre-Professional": "#475569",
  "Other":                     "#6B7280",
};

export type BoothRow = {
  id: string;
  org_id: string;
  org_name: string;
  org_slug: string;
  org_logo_url: string | null;
  elevator_pitch: string | null;
  video_url: string | null;
  website_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  cover_image_url: string | null;
  image_urls: string[];
  category: string | null;
  isFake?: boolean;
};

export type BoothEventRow = {
  id: string;
  title: string;
  event_at: string;
  location: string | null;
  description: string | null;
};

// 20 fake booths shown only to admins in test mode
export const FAKE_BOOTHS: BoothRow[] = [
  { id:"fake-1",  org_id:"fake-1",  org_name:"Aggie Robotics Club",          org_slug:"fake-robotics",     org_logo_url:null, elevator_pitch:"We build, code, and compete with robots. From FIRST to autonomous drones — if it moves and you made it, you belong here.", video_url:null, website_url:"https://example.com", instagram_url:null, tiktok_url:null, cover_image_url:null, image_urls:[], category:"STEM & Technology",         isFake:true },
  { id:"fake-2",  org_id:"fake-2",  org_name:"Pre-Med Society",               org_slug:"fake-premed",       org_logo_url:null, elevator_pitch:"Helping future doctors navigate undergrad with MCAT prep, physician panels, shadowing, and a community that gets it.", video_url:null, website_url:null, instagram_url:"https://instagram.com", tiktok_url:null, cover_image_url:null, image_urls:[], category:"Academic & Pre-Professional", isFake:true },
  { id:"fake-3",  org_id:"fake-3",  org_name:"Multicultural Leadership Council", org_slug:"fake-mlc",       org_logo_url:null, elevator_pitch:"A coalition of cultural orgs amplifying diverse voices on campus through events, advocacy, and cross-cultural connection.", video_url:null, website_url:null, instagram_url:null, tiktok_url:null, cover_image_url:null, image_urls:[], category:"Cultural & Identity",        isFake:true },
  { id:"fake-4",  org_id:"fake-4",  org_name:"Campus Christian Fellowship",   org_slug:"fake-ccf",          org_logo_url:null, elevator_pitch:"A welcoming community for students to explore faith, build lasting friendships, and grow together in life and spirit.", video_url:null, website_url:"https://example.com", instagram_url:null, tiktok_url:null, cover_image_url:null, image_urls:[], category:"Faith & Spirituality",       isFake:true },
  { id:"fake-5",  org_id:"fake-5",  org_name:"Women in Engineering",          org_slug:"fake-wie",          org_logo_url:null, elevator_pitch:"Supporting and empowering women in STEM through mentorship, career events, and a network of engineers who lift each other up.", video_url:null, website_url:null, instagram_url:"https://instagram.com", tiktok_url:null, cover_image_url:null, image_urls:[], category:"STEM & Technology",         isFake:true },
  { id:"fake-6",  org_id:"fake-6",  org_name:"Photography Society",           org_slug:"fake-photo",        org_logo_url:null, elevator_pitch:"Whether you shoot on your phone or a $3,000 camera, we're here for it. Workshops, photo walks, and monthly showcases.", video_url:null, website_url:null, instagram_url:"https://instagram.com", tiktok_url:"https://tiktok.com", cover_image_url:null, image_urls:[], category:"Arts & Performance",        isFake:true },
  { id:"fake-7",  org_id:"fake-7",  org_name:"Aggie Entrepreneurs",           org_slug:"fake-entrepreneurs", org_logo_url:null, elevator_pitch:"From idea to pitch deck — we help student founders build real businesses with workshops, competitions, and investor connections.", video_url:null, website_url:"https://example.com", instagram_url:null, tiktok_url:null, cover_image_url:null, image_urls:[], category:"Academic & Pre-Professional", isFake:true },
  { id:"fake-8",  org_id:"fake-8",  org_name:"Outdoor Adventures Club",       org_slug:"fake-outdoors",     org_logo_url:null, elevator_pitch:"Hiking, kayaking, rock climbing, camping — we get you outside. All skill levels welcome. Gear provided for most trips.", video_url:null, website_url:null, instagram_url:"https://instagram.com", tiktok_url:"https://tiktok.com", cover_image_url:null, image_urls:[], category:"Sports & Competition",      isFake:true },
  { id:"fake-9",  org_id:"fake-9",  org_name:"Black Student Alliance",        org_slug:"fake-bsa",          org_logo_url:null, elevator_pitch:"A home away from home for Black students — cultural events, community service, mentorship, and unapologetic celebration of identity.", video_url:null, website_url:null, instagram_url:"https://instagram.com", tiktok_url:null, cover_image_url:null, image_urls:[], category:"Cultural & Identity",        isFake:true },
  { id:"fake-10", org_id:"fake-10", org_name:"Korean Student Association",    org_slug:"fake-ksa",          org_logo_url:null, elevator_pitch:"KSA brings together Korean and Korean-American students through cultural events, K-food nights, and a tight-knit community.", video_url:null, website_url:null, instagram_url:"https://instagram.com", tiktok_url:"https://tiktok.com", cover_image_url:null, image_urls:[], category:"Cultural & Identity",        isFake:true },
  { id:"fake-11", org_id:"fake-11", org_name:"Debate & Forensics Society",    org_slug:"fake-debate",       org_logo_url:null, elevator_pitch:"Sharpen your arguments and compete nationally. We train students in parliamentary and policy debate — no experience needed to join.", video_url:null, website_url:"https://example.com", instagram_url:null, tiktok_url:null, cover_image_url:null, image_urls:[], category:"Academic & Pre-Professional", isFake:true },
  { id:"fake-12", org_id:"fake-12", org_name:"Student Government Association", org_slug:"fake-sga",         org_logo_url:null, elevator_pitch:"The official student voice on campus. Apply your leadership, shape university policy, and advocate for the student body.", video_url:null, website_url:"https://example.com", instagram_url:null, tiktok_url:null, cover_image_url:null, image_urls:[], category:"Politics & Advocacy",        isFake:true },
  { id:"fake-13", org_id:"fake-13", org_name:"Campus Media Network",          org_slug:"fake-media",        org_logo_url:null, elevator_pitch:"Student-run TV, radio, print, and digital. We cover the campus beat and train the next generation of journalists and creators.", video_url:null, website_url:"https://example.com", instagram_url:"https://instagram.com", tiktok_url:"https://tiktok.com", cover_image_url:null, image_urls:[], category:"Media & Communications",    isFake:true },
  { id:"fake-14", org_id:"fake-14", org_name:"Community Impact",              org_slug:"fake-impact",       org_logo_url:null, elevator_pitch:"The largest student-run service org on campus. We coordinate volunteers across 20+ nonprofits and organize large-scale community events.", video_url:null, website_url:"https://example.com", instagram_url:null, tiktok_url:null, cover_image_url:null, image_urls:[], category:"Community Service",         isFake:true },
  { id:"fake-15", org_id:"fake-15", org_name:"Environmental Action Coalition", org_slug:"fake-env",         org_logo_url:null, elevator_pitch:"Climate advocacy, campus sustainability, and environmental justice. We push for real change from the ground up.", video_url:null, website_url:null, instagram_url:"https://instagram.com", tiktok_url:null, cover_image_url:null, image_urls:[], category:"Politics & Advocacy",        isFake:true },
  { id:"fake-16", org_id:"fake-16", org_name:"Gaming & Esports Club",         org_slug:"fake-gaming",       org_logo_url:null, elevator_pitch:"Competitive and casual gaming for everyone. League, Valorant, Smash, chess — weekly tournaments and a chill place to play.", video_url:null, website_url:null, instagram_url:"https://instagram.com", tiktok_url:"https://tiktok.com", cover_image_url:null, image_urls:[], category:"Social & Recreation",       isFake:true },
  { id:"fake-17", org_id:"fake-17", org_name:"Dance Marathon",                org_slug:"fake-dance",        org_logo_url:null, elevator_pitch:"A 24-hour dance event that raises money for children's hospitals. Join thousands of students moving for kids who can't.", video_url:null, website_url:"https://example.com", instagram_url:"https://instagram.com", tiktok_url:"https://tiktok.com", cover_image_url:null, image_urls:[], category:"Community Service",         isFake:true },
  { id:"fake-18", org_id:"fake-18", org_name:"ASCE Civil Engineering Society", org_slug:"fake-asce",        org_logo_url:null, elevator_pitch:"Concrete canoe, steel bridge, and endless networking. The home of civil engineers who build things that last.", video_url:null, website_url:"https://example.com", instagram_url:null, tiktok_url:null, cover_image_url:null, image_urls:[], category:"STEM & Technology",         isFake:true },
  { id:"fake-19", org_id:"fake-19", org_name:"Mental Health Matters",         org_slug:"fake-mhm",          org_logo_url:null, elevator_pitch:"Destigmatizing mental health through peer support, campus advocacy, and open conversations. You're not alone.", video_url:null, website_url:null, instagram_url:"https://instagram.com", tiktok_url:null, cover_image_url:null, image_urls:[], category:"Health & Wellness",         isFake:true },
  { id:"fake-20", org_id:"fake-20", org_name:"Volleyball Club",               org_slug:"fake-volleyball",   org_logo_url:null, elevator_pitch:"Competitive indoor and beach volleyball for all skill levels. We travel to tournaments and have weekly open gym nights.", video_url:null, website_url:null, instagram_url:"https://instagram.com", tiktok_url:null, cover_image_url:null, image_urls:[], category:"Sports & Competition",      isFake:true },
];

export const QUIZ_QUESTIONS = [
  {
    q: "What are you most passionate about?",
    options: [
      { label: "Science, tech, or engineering",     cats: ["STEM & Technology"] },
      { label: "Art, music, or performance",         cats: ["Arts & Performance"] },
      { label: "Giving back to the community",       cats: ["Community Service"] },
      { label: "Business, finance, or leadership",   cats: ["Academic & Pre-Professional"] },
      { label: "Culture, identity, or heritage",     cats: ["Cultural & Identity"] },
      { label: "Sports, fitness, or the outdoors",   cats: ["Sports & Competition", "Health & Wellness"] },
      { label: "Media, journalism, or content",      cats: ["Media & Communications"] },
      { label: "Faith and spiritual growth",         cats: ["Faith & Spirituality"] },
    ],
  },
  {
    q: "What do you want to get out of an org?",
    options: [
      { label: "Resume-building and career skills", cats: ["Academic & Pre-Professional"] },
      { label: "Fun and a social circle",           cats: ["Social & Recreation"] },
      { label: "Competing and winning",             cats: ["Sports & Competition"] },
      { label: "Learning something new",            cats: ["STEM & Technology", "Academic & Pre-Professional"] },
      { label: "Making a real-world impact",        cats: ["Community Service", "Politics & Advocacy"] },
      { label: "Creative expression",               cats: ["Arts & Performance", "Media & Communications"] },
      { label: "Community that shares my values",   cats: ["Cultural & Identity", "Faith & Spirituality"] },
    ],
  },
  {
    q: "How do you prefer to spend your time?",
    options: [
      { label: "Building or coding projects",       cats: ["STEM & Technology"] },
      { label: "Performing or creating",            cats: ["Arts & Performance", "Media & Communications"] },
      { label: "Volunteering or organizing",        cats: ["Community Service"] },
      { label: "Networking events and panels",      cats: ["Academic & Pre-Professional"] },
      { label: "Competing in tournaments",          cats: ["Sports & Competition"] },
      { label: "Hosting socials and game nights",   cats: ["Social & Recreation"] },
      { label: "Rallying for causes I care about",  cats: ["Politics & Advocacy"] },
    ],
  },
  {
    q: "What kind of community do you thrive in?",
    options: [
      { label: "A shared cultural background",     cats: ["Cultural & Identity"] },
      { label: "Shared faith or values",           cats: ["Faith & Spirituality"] },
      { label: "Driven and goal-oriented people",  cats: ["Academic & Pre-Professional", "STEM & Technology"] },
      { label: "Creative and expressive people",   cats: ["Arts & Performance"] },
      { label: "Outdoorsy, active, sporty people", cats: ["Sports & Competition", "Health & Wellness"] },
      { label: "Laid-back, welcoming vibes",       cats: ["Social & Recreation"] },
      { label: "People making a difference",       cats: ["Community Service", "Politics & Advocacy"] },
    ],
  },
  {
    q: "What best describes you right now?",
    options: [
      { label: "Freshman figuring things out",     cats: ["Social & Recreation", "Academic & Pre-Professional"] },
      { label: "Looking to lead something",        cats: ["Academic & Pre-Professional", "Politics & Advocacy"] },
      { label: "Want to compete at a high level",  cats: ["Sports & Competition"] },
      { label: "Need a creative outlet",           cats: ["Arts & Performance", "Media & Communications"] },
      { label: "Want to give back",                cats: ["Community Service"] },
      { label: "Looking for people like me",       cats: ["Cultural & Identity", "Faith & Spirituality"] },
      { label: "Just want to have fun",            cats: ["Social & Recreation"] },
    ],
  },
] as const;
