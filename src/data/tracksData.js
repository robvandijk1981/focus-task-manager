// Initial data structure based on user's Excel file
export const initialTracksData = [
  {
    id: 'freelance-consultant',
    name: 'Freelance Consultant',
    color: 'blue',
    notes: '',
    context: 'Professional consulting work including client projects, proposals, and deliverables. Focus on high-quality service delivery and client satisfaction.',
    goals: [
      {
        id: 'railcenter-workforce',
        name: 'Railcenter workforce model built',
        tasks: [
          { id: 'task-1', text: 'Create detailplanning', priority: null },
          { id: 'task-2', text: 'Prepare for stakeholder meeting', priority: null }
        ]
      },
      {
        id: 'om-workforce',
        name: 'OM workforce model built',
        tasks: [
          { id: 'task-3', text: 'Sturen reminder vragen input plv HO', priority: null },
          { id: 'task-4', text: 'Lijst met te ontwikkelen features selecteren opstellen nav input AP Amsterdam', priority: null },
          { id: 'task-5', text: 'Werksessie Oost Nederland 2 oktober', priority: null },
          { id: 'task-6', text: 'Werksessie Oost Nederland 2 oktober voorbereiden', priority: null },
          { id: 'task-7', text: 'Eerste selectie features ontwikkelen', priority: null },
          { id: 'task-8', text: 'Werksessie AP\'s voorbereiden 29 september', priority: null },
          { id: 'task-9', text: 'Werksessie AP\'s 29 september uitvoeren', priority: null }
        ]
      },
      {
        id: 'schiphol-workforce',
        name: 'Schiphol workforce model built',
        tasks: [
          { id: 'task-10', text: 'Voorbereiden kennismaking met Bas 28 augustus', priority: null },
          { id: 'task-11', text: 'Voorleggen contouren voorstel 29 augustus', priority: null }
        ]
      },
      {
        id: 'nlmtd-projects',
        name: 'Sell nlmtd People & Change projects (ongoing)',
        tasks: [
          { id: 'task-12', text: 'List of stakeholders and initiatives', priority: null }
        ]
      },
      {
        id: 'nlmtd-internal',
        name: 'nlmtd internal tasks completed (ongoing)',
        tasks: [
          { id: 'task-13', text: 'Complete PD tasks for this sprint', priority: null }
        ]
      }
    ]
  },
  {
    id: 'business-owner',
    name: 'Business Owner',
    color: 'green',
    notes: '',
    context: 'ModellenWerk business operations including lead generation, marketing campaigns, and business development. Focus on growth and revenue generation.',
    goals: [
      {
        id: 'modellenwerk-leads',
        name: 'Leads created for ModellenWerk',
        tasks: [
          { id: 'task-14', text: 'Visie in deckje integreren en review', priority: null }
        ]
      },
      {
        id: 'modellenwerk-marketing',
        name: 'Marketing for ModellenWerk',
        tasks: []
      },
      {
        id: 'functional-design',
        name: 'Functional design finished',
        tasks: [
          { id: 'task-15', text: 'Sturen deckje Architect naar Don (en Koen?) + vervolgafspraak voorstellen', priority: null }
        ]
      },
      {
        id: 'technical-design',
        name: 'Technical design finished',
        tasks: []
      },
      {
        id: 'register-kvk',
        name: 'Register KvK en website',
        tasks: [
          { id: 'task-16', text: 'Register KvK and launch website', priority: null }
        ]
      }
    ]
  },
  {
    id: 'family-man',
    name: 'Family Man',
    color: 'orange',
    notes: '',
    context: 'Family responsibilities including financial planning, children\'s activities, and family time. Focus on work-life balance and family wellbeing.',
    goals: [
      {
        id: 'financial-runway',
        name: 'Keep financial runway at 15K',
        tasks: []
      },
      {
        id: 'children-activities',
        name: 'Do cool stuff with children',
        tasks: []
      },
      {
        id: 'plan-trips',
        name: 'Plan great trips',
        tasks: []
      }
    ]
  },
  {
    id: 'musician',
    name: 'Musician',
    color: 'purple',
    notes: '',
    context: 'Music creation and performance including track production, live performances, and music marketing. Focus on artistic expression and audience building.',
    goals: [
      {
        id: 'produce-tracks',
        name: 'Produce great tracks',
        tasks: [
          { id: 'task-17', text: 'Master 2 tracks Weeknd Plans / Loretta', priority: null },
          { id: 'task-18', text: 'Finish mixing on North East EP', priority: null },
          { id: 'task-19', text: 'Finish mixing on Groovemaster EP', priority: null },
          { id: 'task-20', text: 'Finish mixing on Dark Matter EP', priority: null }
        ]
      },
      {
        id: 'awesome-gigs',
        name: 'Do awesome gigs',
        tasks: []
      },
      {
        id: 'mascott-marketing',
        name: 'Marketing for Mascott',
        tasks: [
          { id: 'task-21', text: 'Weekly 3x Insta post', priority: null }
        ]
      },
      {
        id: 'technoord-sessions',
        name: 'Organize and market TechNoord Sessions',
        tasks: [
          { id: 'task-22', text: 'Weekly 3x Insta post', priority: null }
        ]
      }
    ]
  },
  {
    id: 'social',
    name: 'Social',
    color: 'pink',
    notes: '',
    context: 'Social activities and relationships including parties, friend meetups, and networking events. Focus on maintaining relationships and social connections.',
    goals: [
      {
        id: 'awesome-parties',
        name: 'Visit awesome parties',
        tasks: [
          { id: 'task-23', text: 'Plan for ADE', priority: null }
        ]
      },
      {
        id: 'plan-meetings',
        name: 'Plan meetings with friends',
        tasks: []
      }
    ]
  },
  {
    id: 'passive-income',
    name: 'Passive Income',
    color: 'teal',
    notes: '',
    context: 'Investment activities and passive income experiments including stock investments, real estate, and business automation. Focus on long-term wealth building.',
    goals: [
      {
        id: 'passive-income-source',
        name: 'Create source for passive income',
        tasks: [
          { id: 'task-24', text: 'See options and pick one', priority: null }
        ]
      }
    ]
  },
  {
    id: 'maintenance-man',
    name: 'Maintenance Man',
    color: 'gray',
    notes: '',
    context: 'Recurring maintenance tasks and administrative duties including business admin, personal admin, health, and home maintenance. Focus on keeping life organized and running smoothly.',
    goals: []
  }
];

// Color schemes for each track
export const trackColors = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    accent: 'bg-blue-100',
    button: 'bg-blue-500 hover:bg-blue-600'
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-900',
    accent: 'bg-green-100',
    button: 'bg-green-500 hover:bg-green-600'
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-900',
    accent: 'bg-orange-100',
    button: 'bg-orange-500 hover:bg-orange-600'
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-900',
    accent: 'bg-purple-100',
    button: 'bg-purple-500 hover:bg-purple-600'
  },
  pink: {
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    text: 'text-pink-900',
    accent: 'bg-pink-100',
    button: 'bg-pink-500 hover:bg-pink-600'
  },
  teal: {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-900',
    accent: 'bg-teal-100',
    button: 'bg-teal-500 hover:bg-teal-600'
  },
  gray: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-900',
    accent: 'bg-gray-100',
    button: 'bg-gray-500 hover:bg-gray-600'
  }
};

// Priority colors
export const priorityColors = {
  high: 'bg-red-100 border-red-300 text-red-800',
  medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  low: 'bg-green-100 border-green-300 text-green-800'
};

