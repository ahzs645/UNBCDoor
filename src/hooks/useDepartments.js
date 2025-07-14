import { useState, useMemo } from 'react'
import { departmentTypes } from '../data/departments'

export const useDepartments = () => {
  const [searchQuery, setSearchQuery] = useState('')

  const searchDepartments = (query) => {
    setSearchQuery(query)
  }

  const departments = useMemo(() => {
    if (!searchQuery) return departmentTypes
    
    const filtered = {}
    Object.entries(departmentTypes).forEach(([typeKey, typeData]) => {
      const filteredDepts = {}
      Object.entries(typeData.departments).forEach(([mainKey, mainData]) => {
        const filteredMain = {}
        Object.entries(mainData).forEach(([subKey, subData]) => {
          if (subKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (Array.isArray(subData) && subData.some(item => 
                item.toLowerCase().includes(searchQuery.toLowerCase())))) {
            filteredMain[subKey] = subData
          } else if (typeof subData === 'object') {
            Object.entries(subData).forEach(([subSubKey, subSubData]) => {
              if (subSubKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  subSubData.some(item => 
                    item.toLowerCase().includes(searchQuery.toLowerCase()))) {
                if (!filteredMain[subKey]) filteredMain[subKey] = {}
                filteredMain[subKey][subSubKey] = subSubData
              }
            })
          }
        })
        if (Object.keys(filteredMain).length > 0) {
          filteredDepts[mainKey] = filteredMain
        }
      })
      if (Object.keys(filteredDepts).length > 0) {
        filtered[typeKey] = { ...typeData, departments: filteredDepts }
      }
    })
    
    return filtered
  }, [searchQuery])

  return { departments, searchDepartments }
}