export const CATEGORIES = [
  'Water Issues',
  'Food Problems',
  'Sanitary Issues',
  'Bathroom Issues',
  'Hostel Problems',
  'Staff Issues',
  'Ragging',
  'Student Safety',
  'WiFi Problems',
  'Electrical Issues',
  'Classroom Problems',
  'Lab Problems',
  'Transport Problems',
  'Library Problems',
  'Medical Support',
  'Mental Health',
  'Academic Issues',
  'Other',
]

export const STATUSES = [
  'Submitted',
  'Under Review',
  'In Progress',
  'Resolved',
  'Rejected',
]

export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']

export const DEPARTMENTS = [
  'IT', 'CIVIL', 'CSBS', 'CSE', 'AI-ML', 'ECE', 'EEE', 'MECH', 'AMCS', 'MCT', 'VLSI', 'EC', 'FASHION', 'ICE', 'BME',
]

export const PRIORITY_THRESHOLDS = {
  MEDIUM:   2,
  HIGH:     4,
  CRITICAL: 8,
}

export const STATUS_COLORS = {
  Submitted:      'tag-submitted',
  'Under Review': 'tag-review',
  'In Progress':  'tag-progress',
  Resolved:       'tag-resolved',
  Rejected:       'tag-rejected',
}

export const PRIORITY_COLORS = {
  Low:      'tag-low',
  Medium:   'tag-medium',
  High:     'tag-high',
  Critical: 'tag-critical',
}

import {
  Droplets,
  Utensils,
  SprayCan,
  ShowerHead,
  House,
  UserRound,
  Siren,
  Shield,
  Wifi,
  Zap,
  School,
  Microscope,
  Bus,
  Library,
  Hospital,
  Brain,
  BookOpen,
  Pin,
} from 'lucide-react'

// Category icons (Lucide React components)
export const CATEGORY_ICONS = {
  'Water Issues':      Droplets,
  'Food Problems':     Utensils,
  'Sanitary Issues':   SprayCan,
  'Bathroom Issues':   ShowerHead,
  'Hostel Problems':   House,
  'Staff Issues':      UserRound,
  'Ragging':           Siren,
  'Student Safety':    Shield,
  'WiFi Problems':     Wifi,
  'Electrical Issues': Zap,
  'Classroom Problems':School,
  'Lab Problems':      Microscope,
  'Transport Problems':Bus,
  'Library Problems':  Library,
  'Medical Support':   Hospital,
  'Mental Health':     Brain,
  'Academic Issues':   BookOpen,
  'Other':             Pin,
}

