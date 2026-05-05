'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function TomorrowRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/upcoming') }, [])
  return null
}