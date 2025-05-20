import { NextRequest, NextResponse } from 'next/server'
import { ResumeData } from '~/app/(app)/dashboard/resume/types'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const template = url.searchParams.get('template')
    const data = url.searchParams.get('data')

    if (!template || !data) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Decode the data
    let resumeData: ResumeData
    try {
      resumeData = JSON.parse(decodeURIComponent(data))
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid resume data format' },
        { status: 400 }
      )
    }

    // Return success with the template and data
    return NextResponse.json({
      success: true,
      template,
      resumeData
    })
  } catch (error) {
    console.error('Preview generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    )
  }
} 