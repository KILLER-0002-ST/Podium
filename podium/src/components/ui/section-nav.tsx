"use client"

import { cn } from "~/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  BookOpen, 
  Code, 
  BriefcaseIcon, 
  FolderKanban,
  Award
} from "lucide-react"

interface SectionNavProps {
  className?: string
}

export function SectionNav({ className }: SectionNavProps) {
  const pathname = usePathname()
  
  const sections = [
    {
      title: "Skills",
      href: "/dashboard/contents/skills",
      icon: Code
    },
    {
      title: "Work Experience",
      href: "/dashboard/contents/work_experience",
      icon: BriefcaseIcon
    },
    {
      title: "Education",
      href: "/dashboard/contents/education",
      icon: BookOpen
    },
    {
      title: "Projects",
      href: "/dashboard/contents/projects",
      icon: FolderKanban
    },
    {
      title: "Awards",
      href: "/dashboard/contents/awards",
      icon: Award
    }
  ]

  return (
    <div className={cn("mb-6", className)}>
      <div className="flex flex-wrap gap-10">
        {sections.map((section) => {
          const isActive = pathname === section.href
          return (
            <Link
              key={section.href}
              href={section.href}
              className={cn(
                "inline-flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-md",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-input"
              )}
            >
              <section.icon className="h-4 w-4" />
              <span>{section.title}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
} 