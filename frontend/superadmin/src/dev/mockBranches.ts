import { loadMock } from './persist';

export interface MockBranch {
  id: string;
  name: string;
  address: string;
  phone: string;
  adminUserId: string | null;
  adminName: string | null;
  studentsCount: number;
  activeGroupsCount: number;
  monthlyRevenue: number;
  debt: number;
  onlineNow: number;
  status: 'active' | 'archived';
  createdAt: string;
}

const NOW = new Date();

const DEFAULT_BRANCHES: MockBranch[] = [
  {
    id: 'branch-1',
    name: 'Центральный (Мирзо-Улугбек)',
    address: 'Ташкент, ул. Амира Темура, 108',
    phone: '+998712001234',
    adminUserId: 'user-admin-1',
    adminName: 'Нодира Юсупова',
    studentsCount: 142,
    activeGroupsCount: 8,
    monthlyRevenue: 84_600_000,
    debt: 6_200_000,
    onlineNow: 23,
    status: 'active',
    createdAt: new Date(NOW.getTime() - 720 * 86400_000).toISOString(),
  },
  {
    id: 'branch-2',
    name: 'Юнусабад',
    address: 'Ташкент, ул. Богишамол, 45',
    phone: '+998712005678',
    adminUserId: null,
    adminName: null,
    studentsCount: 87,
    activeGroupsCount: 5,
    monthlyRevenue: 51_300_000,
    debt: 3_100_000,
    onlineNow: 12,
    status: 'active',
    createdAt: new Date(NOW.getTime() - 450 * 86400_000).toISOString(),
  },
  {
    id: 'branch-3',
    name: 'Чиланзар',
    address: 'Ташкент, ул. Чиланзарская, 15',
    phone: '+998712009876',
    adminUserId: null,
    adminName: null,
    studentsCount: 68,
    activeGroupsCount: 4,
    monthlyRevenue: 39_800_000,
    debt: 2_400_000,
    onlineNow: 8,
    status: 'active',
    createdAt: new Date(NOW.getTime() - 300 * 86400_000).toISOString(),
  },
  {
    id: 'branch-4',
    name: 'Самарканд (архив 2024)',
    address: 'Самарканд, ул. Регистан, 12',
    phone: '+998662001234',
    adminUserId: null,
    adminName: null,
    studentsCount: 0,
    activeGroupsCount: 0,
    monthlyRevenue: 0,
    debt: 0,
    onlineNow: 0,
    status: 'archived',
    createdAt: new Date(NOW.getTime() - 900 * 86400_000).toISOString(),
  },
];

export const MOCK_BRANCHES: MockBranch[] = loadMock('branches', DEFAULT_BRANCHES);
