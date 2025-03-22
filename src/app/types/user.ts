export interface School {
  _id: string;
  name: string;
  email: string;
  physicalAddress: string;
  location: {
    country: string;
    state: string;
    _id: string;
  };
  schoolPrefix: string;
  active: boolean;
  logo: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface User {
  schoolId: School;
  // Add other user properties as needed
}
