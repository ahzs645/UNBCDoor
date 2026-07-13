import { useState } from 'react'

export const useSignState = () => {
  const [signData, setSignData] = useState({
    signType: 'faculty',
    departmentType: '',
    mainDepartment: '',
    subDepartment: '',
    subSubDepartment: '',
    name: '',
    position: '',
    tagline: '',
    email: '',
    phone: '',
    cellPhone: '',
    showEmail: true,
    showPhone: true,
    showCellPhone: true,
    roomName: '',
    contactName: '',
    showSecondOccupant: false,
    name2: '',
    position2: '',
    email2: '',
    phone2: '',
    roomName2: '',
    contactName2: '',
    cardHolderType: '',
    showAlumni: false,
    showDesignations: false,
    designations: []
  })

  return [signData, setSignData]
}