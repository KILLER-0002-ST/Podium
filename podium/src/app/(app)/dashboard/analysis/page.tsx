'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAllResume } from '../queries'
import { match } from 'ts-pattern'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '~/components/ui/card'
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '~/components/ui/table'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  TooltipProps
} from 'recharts'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Eye, TrendingUp, Calendar, FileText, Search, ArrowUpDown } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import { Resume } from '../utils'
import { Skeleton } from '~/components/ui/skeleton'

dayjs.extend(relativeTime)
dayjs.extend(advancedFormat)

// Define chart data types
interface ChartDataPoint {
  name: string;
  fullName: string;
  views: number;
}

interface DistributionDataPoint {
  name: string;
  value: number;
}

interface PieLabelProps {
  name: string;
  percent: number;
}

export default function AnalysisPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'title' | 'views' | 'date'>('views')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const resumesQuery = useQuery({
    queryKey: ['all-resume'],
    queryFn: getAllResume,
  })

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
  }

  const changeSort = (column: 'title' | 'views' | 'date') => {
    if (sortBy === column) {
      toggleSortOrder()
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const filteredAndSortedResumes = (): Resume[] => {
    if (resumesQuery.status !== 'success' || !resumesQuery.data) return []

    let filtered = resumesQuery.data.filter(resume => 
      resume.title.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return filtered.sort((a, b) => {
      if (sortBy === 'title') {
        return sortOrder === 'asc' 
          ? a.title.localeCompare(b.title) 
          : b.title.localeCompare(a.title)
      } else if (sortBy === 'views') {
        return sortOrder === 'asc' 
          ? (a.views || 0) - (b.views || 0) 
          : (b.views || 0) - (a.views || 0)
      } else {
        return sortOrder === 'asc' 
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime() 
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
  }

  const prepareChartData = (): ChartDataPoint[] => {
    if (resumesQuery.status !== 'success' || !resumesQuery.data) return []
    
    return resumesQuery.data
      .filter(resume => resume.title && resume.views !== undefined)
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5) // Take top 5 most viewed
      .map(resume => ({
        name: resume.title.length > 15 ? `${resume.title.substring(0, 15)}...` : resume.title,
        fullName: resume.title,
        views: resume.views || 0
      }))
  }

  const getVisibilityDistribution = (): DistributionDataPoint[] => {
    if (resumesQuery.status !== 'success' || !resumesQuery.data) return []
    
    const viewRanges: DistributionDataPoint[] = [
      { name: '0 views', value: 0 },
      { name: '1-10 views', value: 0 },
      { name: '11-50 views', value: 0 },
      { name: '>50 views', value: 0 }
    ]
    
    resumesQuery.data.forEach(resume => {
      const views = resume.views || 0
      if (views === 0) viewRanges[0].value++
      else if (views <= 10) viewRanges[1].value++
      else if (views <= 50) viewRanges[2].value++
      else viewRanges[3].value++
    })
    
    return viewRanges.filter(range => range.value > 0)
  }

  const getTotalViews = (): number => {
    if (resumesQuery.status !== 'success' || !resumesQuery.data) return 0
    return resumesQuery.data.reduce((sum, resume) => sum + (resume.views || 0), 0)
  }

  const getAverageViews = (): number => {
    if (resumesQuery.status !== 'success' || !resumesQuery.data || resumesQuery.data.length === 0) return 0
    return Math.round(getTotalViews() / resumesQuery.data.length)
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

  // Custom formatters for tooltips
  const barChartFormatter = (value: number): [number, string] => [value, 'Views']
  
  const pieChartFormatter = (value: number, name: string): [string, string] => [`${value} resumes`, name]
  
  // Custom label renderer for pie chart
  const renderPieLabel = ({ name, percent }: PieLabelProps): string => 
    `${name}: ${(percent * 100).toFixed(0)}%`

  const labelFormatter = (label: string): string => {
    const dataPoint = prepareChartData().find(item => item.name === label);
    return dataPoint?.fullName || label;
  }

  return (
    <div className="container mx-auto space-y-8 py-6">
      <h1 className="text-3xl font-bold">Resume Analysis</h1>
      
      {match(resumesQuery)
        .with({ status: 'pending' }, () => (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-md" />
              ))}
            </div>
            <Skeleton className="h-80 w-full rounded-md" />
            <Skeleton className="h-96 w-full rounded-md" />
          </div>
        ))
        .with({ status: 'error' }, () => (
          <div className="rounded-md bg-red-50 p-4 text-red-700">
            Something went wrong while fetching resume data. Please try again later.
          </div>
        ))
        .with({ status: 'success' }, () => (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Resumes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold">{resumesQuery.data?.length || 0}</div>
                    <FileText className="h-5 w-5 text-gray-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold">{getTotalViews()}</div>
                    <Eye className="h-5 w-5 text-gray-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Average Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold">{getAverageViews()}</div>
                    <TrendingUp className="h-5 w-5 text-gray-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Most Viewed Resumes</CardTitle>
                  <CardDescription>The top 5 most viewed resumes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={prepareChartData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80}
                        />
                        <YAxis />
                        <RechartsTooltip 
                          formatter={barChartFormatter}
                          labelFormatter={labelFormatter}
                        />
                        <Bar dataKey="views" fill="#4f46e5">
                          {prepareChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>View Distribution</CardTitle>
                  <CardDescription>Resume distribution by view count</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getVisibilityDistribution()}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={renderPieLabel}
                        >
                          {getVisibilityDistribution().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={pieChartFormatter} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Resume Analytics</CardTitle>
                <CardDescription>Detailed view statistics for all your resumes</CardDescription>
                <div className="mt-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search resumes..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption>A list of all your resumes and their view statistics</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          onClick={() => changeSort('title')}
                          className="flex items-center gap-1 px-0 font-medium"
                        >
                          Resume Title
                          {sortBy === 'title' && (
                            <ArrowUpDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          onClick={() => changeSort('date')}
                          className="flex items-center gap-1 px-0 font-medium"
                        >
                          Created
                          {sortBy === 'date' && (
                            <ArrowUpDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button 
                          variant="ghost" 
                          onClick={() => changeSort('views')}
                          className="flex items-center gap-1 px-0 font-medium ml-auto"
                        >
                          Views
                          {sortBy === 'views' && (
                            <ArrowUpDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedResumes().length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6">
                          {searchTerm ? "No resumes match your search" : "No resumes found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAndSortedResumes().map((resume) => (
                        <TableRow key={resume.id}>
                          <TableCell className="font-medium">
                            <a 
                              href={`/dashboard/resume/${resume.slug}`} 
                              className="hover:text-primary hover:underline"
                            >
                              {resume.title}
                            </a>
                          </TableCell>
                          <TableCell className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>{dayjs(resume.created_at).format('MMM D, YYYY')}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Eye className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">{resume.views || 0}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ))
        .exhaustive()}
    </div>
  )
} 