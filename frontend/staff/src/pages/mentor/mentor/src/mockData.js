export const STUDENTS = [
  { name: "Malika Yusupova", img: "https://i.pravatar.cc/150?img=47" },
  { name: "Javlon Rustamov", img: "https://i.pravatar.cc/150?img=12" },
  { name: "Dilnoza Karimova", img: "https://i.pravatar.cc/150?img=25" },
  { name: "Sardor Aliyev", img: "https://i.pravatar.cc/150?img=33" },
  { name: "Kamola Nortojiyeva", img: "https://i.pravatar.cc/150?img=5" },
  { name: "Otabek Yo'ldoshev", img: "https://i.pravatar.cc/150?img=15" },
  { name: "Nilufar Xoshimova", img: "https://i.pravatar.cc/150?img=9" },
];

export const TOP_STUDENTS = [
  { name: "Malika Yusupova", img: "https://i.pravatar.cc/150?img=47", group: "Advanced English A1", score: 96 },
  { name: "Javlon Rustamov", img: "https://i.pravatar.cc/150?img=12", group: "Math Grade 10", score: 91 },
  { name: "Dilnoza Karimova", img: "https://i.pravatar.cc/150?img=25", group: "Robotics Beginners", score: 88 },
  { name: "Sardor Aliyev", img: "https://i.pravatar.cc/150?img=33", group: "Math Grade 10", score: 84 },
];

// 14 kunlik davomat: true = bo'ldi, false = bo'lmadi, null = hali belgilanmagan
export const ATTENDANCE_STUDENTS = [
  {
    name: "Malika Yusupova",
    img: "https://i.pravatar.cc/150?img=47",
    status: [true, true, true, true, false, true, true, true, true, true, true, null, null, null],
  },
  {
    name: "Javlon Rustamov",
    img: "https://i.pravatar.cc/150?img=12",
    status: [true, false, true, true, true, true, false, true, true, false, true, null, null, null],
  },
  {
    name: "Dilnoza Karimova",
    img: "https://i.pravatar.cc/150?img=25",
    status: [true, true, true, false, true, true, true, true, false, true, true, null, null, null],
  },
  {
    name: "Sardor Aliyev",
    img: "https://i.pravatar.cc/150?img=33",
    status: [false, true, true, true, true, false, true, true, true, true, false, null, null, null],
  },
  {
    name: "Kamola Nortojiyeva",
    img: "https://i.pravatar.cc/150?img=5",
    status: [true, true, false, true, true, true, true, false, true, true, true, null, null, null],
  },
  {
    name: "Otabek Yo'ldoshev",
    img: "https://i.pravatar.cc/150?img=15",
    status: [true, true, true, true, true, true, true, true, true, true, true, null, null, null],
  },
  {
    name: "Nilufar Xoshimova",
    img: "https://i.pravatar.cc/150?img=9",
    status: [true, false, true, false, true, true, false, true, true, true, false, null, null, null],
  },
];

// Coin balances va bergan operatsiyalar tarixi
export const COIN_STUDENTS = [
  { id: "4492", name: "Artyom Ivanov", img: "https://i.pravatar.cc/150?img=68", balance: 150 },
  { id: "4493", name: "Malika Yusupova", img: "https://i.pravatar.cc/150?img=47", balance: 210 },
  { id: "4494", name: "Javlon Rustamov", img: "https://i.pravatar.cc/150?img=12", balance: 95 },
  { id: "4495", name: "Dilnoza Karimova", img: "https://i.pravatar.cc/150?img=25", balance: 130 },
  { id: "4496", name: "Sardor Aliyev", img: "https://i.pravatar.cc/150?img=33", balance: 60 },
  { id: "4497", name: "Kamola Nortojiyeva", img: "https://i.pravatar.cc/150?img=5", balance: 175 },
];

export const COIN_HISTORY = [
  { title: "+10 за активность", by: "Malika Yusupova · Ментор А.В.", when: "Сегодня", positive: true },
  { title: "+50 за проект", by: "Javlon Rustamov · Ментор А.В.", when: "Вчера", positive: true },
  { title: "−5 опоздание", by: "Sardor Aliyev · Система", when: "Вчера", positive: false },
  { title: "+5 помощь другу", by: "Dilnoza Karimova · Ментор А.В.", when: "14 Окт", positive: true },
  { title: "+10 за активность", by: "Kamola Nortojiyeva · Ментор А.В.", when: "13 Окт", positive: true },
];
