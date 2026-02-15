// Private Khatmah Management
// This module handles private khatmahs which allow users to create custom groups
// with invited members and track progress together

export interface PrivateKhatmah {
  id: string;
  name: string;
  duration: number; // days to complete (7, 10, 15, 30, 60, 90)
  createdBy: string; // user ID
  createdAt: string;
  memberEmails: string[];
  members?: PrivateKhatmahMember[];
}

export interface PrivateKhatmahMember {
  userId: string;
  email: string;
  joinedAt: string;
  status: 'pending' | 'active';
}

// Get all private khatmahs for current user (localStorage)
export function getPrivateKhatmahs(): PrivateKhatmah[] {
  try {
    const stored = localStorage.getItem('private-khatmahs');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting private khatmahs:', error);
    return [];
  }
}

// Create a new private khatmah (localStorage)
export function createPrivateKhatmah(
  name: string,
  duration: number,
  memberEmails: string[],
  createdBy: string = 'guest'
): PrivateKhatmah {
  const id = `private-khatmah-${duration}-${Date.now()}`;
  const newKhatmah: PrivateKhatmah = {
    id,
    name,
    duration,
    createdBy,
    createdAt: new Date().toISOString(),
    memberEmails,
  };

  const khatmahs = getPrivateKhatmahs();
  khatmahs.push(newKhatmah);
  localStorage.setItem('private-khatmahs', JSON.stringify(khatmahs));

  // Initialize reading progress for this khatmah
  localStorage.setItem(`khatmah-${id}-pages`, JSON.stringify([]));
  
  return newKhatmah;
}

// Get a specific private khatmah by ID
export function getPrivateKhatmahById(id: string): PrivateKhatmah | null {
  const khatmahs = getPrivateKhatmahs();
  return khatmahs.find(k => k.id === id) || null;
}

// Update private khatmah (e.g., add members)
export function updatePrivateKhatmah(id: string, updates: Partial<PrivateKhatmah>): void {
  const khatmahs = getPrivateKhatmahs();
  const index = khatmahs.findIndex(k => k.id === id);
  
  if (index !== -1) {
    khatmahs[index] = { ...khatmahs[index], ...updates };
    localStorage.setItem('private-khatmahs', JSON.stringify(khatmahs));
  }
}

// Add member to private khatmah
export function addMemberToPrivateKhatmah(khatmahId: string, email: string): void {
  const khatmah = getPrivateKhatmahById(khatmahId);
  if (khatmah && !khatmah.memberEmails.includes(email)) {
    updatePrivateKhatmah(khatmahId, {
      memberEmails: [...khatmah.memberEmails, email],
    });
  }
}

// Remove member from private khatmah
export function removeMemberFromPrivateKhatmah(khatmahId: string, email: string): void {
  const khatmah = getPrivateKhatmahById(khatmahId);
  if (khatmah) {
    updatePrivateKhatmah(khatmahId, {
      memberEmails: khatmah.memberEmails.filter(e => e !== email),
    });
  }
}

// Delete a private khatmah
export function deletePrivateKhatmah(id: string): void {
  const khatmahs = getPrivateKhatmahs();
  const filtered = khatmahs.filter(k => k.id !== id);
  localStorage.setItem('private-khatmahs', JSON.stringify(filtered));
  
  // Clean up reading progress
  localStorage.removeItem(`khatmah-${id}-pages`);
  localStorage.removeItem(`khatmah-${id}-currentPage`);
}

// Check if user is member of a private khatmah
export function isPrivateKhatmahMember(khatmahId: string, userEmail: string): boolean {
  const khatmah = getPrivateKhatmahById(khatmahId);
  return khatmah ? khatmah.memberEmails.includes(userEmail) : false;
}

// Get private khatmahs where user is a member
export function getPrivateKhatmahsForUser(userEmail: string): PrivateKhatmah[] {
  const allKhatmahs = getPrivateKhatmahs();
  return allKhatmahs.filter(k => 
    k.createdBy === userEmail || k.memberEmails.includes(userEmail)
  );
}
