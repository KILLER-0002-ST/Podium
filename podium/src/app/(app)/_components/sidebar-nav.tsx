'use client'

import { 
  HomeIcon, 
  FileTextIcon, 
  LogOutIcon, 
  UserIcon, 
  LucideIcon, 
  BarChart4Icon,
  LayersIcon,
  MessageSquareIcon,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '~/components/ui/sidebar'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { apiClient } from '~/lib/client'
import { cn } from '~/lib/utils'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

const LINKS: Array<{
  label: string
  Icon: LucideIcon
  href: string
  tooltip: string
}> = [
  {
    label: 'My Library',
    Icon: HomeIcon,
    href: '/dashboard',
    tooltip: 'Dashboard',
  },
  {
    label: 'My Content',
    Icon: LayersIcon,
    href: '/dashboard/contents',
    tooltip: 'Manage Content',
  },
  {
    label: 'Publish',
    Icon: FileTextIcon,
    href: '/dashboard/templates',
    tooltip: 'Publish Resume',
  },
  {
    label: 'Analysis',
    Icon: BarChart4Icon,
    href: '/dashboard/analysis',
    tooltip: 'Resume Analysis',
  },
  {
    label: 'Chat',
    Icon: MessageSquareIcon,
    href: '/dashboard/chat',
    tooltip: 'Chat with AI',
  }
]

export default function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout/')
      toast.success('Logged out successfully')
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      toast.error('Failed to logout. Please try again.')
    }
  }

  const showLogoutDialog = () => {
    setIsLogoutDialogOpen(true)
  }

  // Helper function to determine if a menu item should be active
  const isLinkActive = (href: string) => {
    if (href === '/dashboard') {
      // Only highlight "My Library" when we're exactly at /dashboard
      return pathname === '/dashboard';
    }
    // For other links, check if pathname starts with the link href
    return pathname.startsWith(href);
  }

  return (
    <>
      <SidebarHeader className="px-3 py-4">
        <div className={cn(
          "flex items-center",
          isCollapsed ? "justify-center" : "gap-2"
        )}>
          <div className="relative h-10 w-10 overflow-hidden rounded-md border border-gray-200 bg-gray-100 flex-shrink-0">
            <Image
              src="/pulpitlogo.png"
              alt="PulPit Logo"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold">PulPit</span>
              <span className="text-xs text-muted-foreground">Resume Builder</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarGroup>
        <SidebarGroupLabel className={cn(isCollapsed && "sr-only")}>
          Dashboard
        </SidebarGroupLabel>
        <SidebarMenu>
          {LINKS.map((link) => (
            <SidebarMenuButton
              key={link.href}
              asChild
              tooltip={link.tooltip}
              isActive={isLinkActive(link.href)}
            >
              <Link href={link.href} className="flex items-center hover:bg-gray-100">
                <link.Icon className="h-5 w-5 shrink-0" />
                <span className="ml-2">{link.label}</span>
              </Link>
            </SidebarMenuButton>
          ))}
        </SidebarMenu>
      </SidebarGroup>

      <SidebarFooter className="mt-auto">
        <Separator className="my-2" />
        <SidebarMenu>
          <SidebarMenuButton
            asChild
            tooltip="Profile"
            isActive={pathname.startsWith('/dashboard/profile')}
          >
            <Link href="/dashboard/profile" className="flex items-center">
              <UserIcon className="h-5 w-5 shrink-0" />
              <span className="ml-2">Profile</span>
            </Link>
          </SidebarMenuButton>
          
          <SidebarMenuButton
            tooltip="Logout"
            onClick={showLogoutDialog}
            className="flex items-center cursor-pointer"
          >
            <LogOutIcon className="h-5 w-5 shrink-0" />
            <span className="ml-2">Logout</span>
          </SidebarMenuButton>
        </SidebarMenu>
      </SidebarFooter>

      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to logout?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsLogoutDialogOpen(false)}>
              No
            </Button>
            <Button 
              type="button" 
              variant="default" 
              onClick={() => {
                setIsLogoutDialogOpen(false);
                handleLogout();
              }}
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
