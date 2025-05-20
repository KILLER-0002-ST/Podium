'use client'

import { useState, useEffect } from 'react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

// Old format (stringified)
const oldFormatData = `{"personal_info":{"name":"Ishita","gender":"-","contact_no":"‪+14387288947‬","email":"ishitajain0810@gmail.com","github":"-","linkedin":"https://www.linkedin.com/in/ishita-jain26/","website":"-"},"qualifications":[{"title":"Symbiosis Institute of Media & Communication","description":"01.2018 - 01.2020"},{"title":"Institute of Chartered Accountants of India","description":"01.2010 - 01.2017"},{"title":"Hamidia College of Arts and Commerce","description":"01.2011 - 01.2014"}],"skills":[{"name":"Media Planning"},{"name":"Digital Marketing"},{"name":"SEO"},{"name":"Social Media Management"},{"name":"Content Creation"},{"name":"Project Management"},{"name":"Strategic Leadership"},{"name":"A/B Testing"},{"name":"Client Servicing"},{"name":"Campaign Management"},{"name":"Market Research"},{"name":"Budget Management"},{"name":"Audit Compliance"},{"name":"Tax Planning"}],"work_experience":[{"company_name":"Madison World","job_title":"Planning Manager- GCPL","duration":"11.2022 - 03.2024","key_responsbilities":["Led the development of integrated cross-channel media strategies","Developing and executing digital marketing strategies","Optimizing campaigns to maximize ROI through continuous A/B testing","Managed a team of 4-5 junior media planners/Interns","Executed 11 campaigns including 7 sustenance and 4 search campaigns","Communicated strategic responses to Senior Client Teams"]},{"company_name":"Madison World","job_title":"Media Planner","duration":"02.2021 - 10.2022","key_responsbilities":["Developed strategic media plans","Conducted market research","Provided regular updates to clients","Led brainstorming sessions"]},{"company_name":"Leader Care Finance","job_title":"Social media freelancer","duration":"04.2020 - 01.2021","key_responsbilities":["Managed LinkedIn, Facebook, Instagram","Developed and implemented marketing plans","Created and managed content calendars","Monitored industry trends"]},{"company_name":"Karvy Insights","job_title":"Qualitative Research Intern","duration":"04.2019 - 06.2024","key_responsbilities":["Handled the entire research process","Conducted and moderated 5-6 in-depth interviews","Carried out research coordination","Assisted and conducted 2 Focused group discussions"]},{"company_name":"JAIN CHATTERJEE & ASSOCIATES","job_title":"Senior Audit Executive","duration":"01.2016 - 05.2018","key_responsbilities":["Conducted audits to ensure compliance","Prepared final accounts","Compiled audit reports","Managed tax planning & compliance"]}],"projects":[]}`

// New format (object)
const newFormatData = {
  "awards": [],
  "skills": [
    {"name": "Java", "level": 5},
    {"name": "JavaScript", "level": 5}
  ],
  "projects": [],
  "education": [
    {
      "dt": "-",
      "url": "-",
      "title": "Master's in Applied Computer Science, MACS",
      "description": "Courses: Advanced Topics in Web Development, Cloud Computing"
    }
  ],
  "references": [],
  "publications": [],
  "personal_info": {
    "name": "Jatin Partap Rana",
    "email": "jatin.rana.partap@gmail.com",
    "gender": "-",
    "github": "-",
    "website": "-",
    "linkedin": "LinkedIn Profile",
    "contact_no": "(902) 210-8875"
  },
  "work_experience": [
    {
      "duration": "April 2024 - Present",
      "job_title": "Software Engineer",
      "company_name": "SpryPoint, Canada",
      "key_responsbilities": [
        "Developed APIs and jobs for payment processing workflows"
      ]
    }
  ]
}

export default function TestResumeData() {
  const [oldFormat, setOldFormat] = useState<any>(null)
  const [newFormat, setNewFormat] = useState<any>(null)
  
  useEffect(() => {
    // Process old format
    try {
      setOldFormat(JSON.parse(oldFormatData))
    } catch (e) {
      console.error("Error parsing old format", e)
    }
    
    // Set new format
    setNewFormat(newFormatData)
  }, [])
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Resume Data Format Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Old Format (stringified JSON)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Personal Info</h2>
              {oldFormat && (
                <div>
                  <p>Name: {oldFormat.personal_info.name}</p>
                  <p>Email: {oldFormat.personal_info.email}</p>
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Education/Qualifications</h2>
              {oldFormat && oldFormat.qualifications && (
                <ul className="list-disc pl-5">
                  {oldFormat.qualifications.map((qual: any, idx: number) => (
                    <li key={idx}>
                      {qual.title} - {qual.description}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>New Format (object)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Personal Info</h2>
              {newFormat && (
                <div>
                  <p>Name: {newFormat.personal_info.name}</p>
                  <p>Email: {newFormat.personal_info.email}</p>
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Education</h2>
              {newFormat && newFormat.education && (
                <ul className="list-disc pl-5">
                  {newFormat.education.map((edu: any, idx: number) => (
                    <li key={idx}>
                      {edu.title} - {edu.description}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Test Data</h2>
        <Button className="mr-4" onClick={() => alert("Both formats should be handled correctly in the app!")}>
          Confirm Integration
        </Button>
      </div>
    </div>
  )
} 