export interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  positionTitle: string;
  role: string;
  movement: string;
  x: number; // 0-100 (pitch percentage)
  y: number; // 0-100 (pitch percentage)
  stats: {
    stamina: number;
    speed: number;
    passing: number;
    defense: number;
    attack: number;
    morale: number;
  };
  status: 'active' | 'sub' | 'injured';
  errors?: number;
  rating?: number;
}

export type Formation = '2-3-1' | '3-2-1' | '2-1-2-1' | '3-1-2';
export type Mentality = 'Defensive' | 'Balanced' | 'Attacking';

export const FORMATION_POSITIONS: Record<Formation, { x: number; y: number }[]> = {
  '2-3-1': [
    { x: 5, y: 50 },  // GK
    { x: 25, y: 30 }, // LB
    { x: 25, y: 70 }, // RB
    { x: 50, y: 20 }, // LM
    { x: 50, y: 50 }, // CM
    { x: 50, y: 80 }, // RM
    { x: 80, y: 50 }, // ST
  ],
  '3-2-1': [
    { x: 5, y: 50 },  // GK
    { x: 25, y: 20 }, // LB
    { x: 25, y: 50 }, // CB
    { x: 25, y: 80 }, // RB
    { x: 55, y: 35 }, // CM1
    { x: 55, y: 65 }, // CM2
    { x: 85, y: 50 }, // ST
  ],
  '2-1-2-1': [
    { x: 5, y: 50 },  // GK
    { x: 25, y: 30 }, // LB
    { x: 25, y: 70 }, // RB
    { x: 45, y: 50 }, // CDM
    { x: 65, y: 30 }, // RAM
    { x: 65, y: 70 }, // LAM
    { x: 85, y: 50 }, // ST
  ],
  '3-1-2': [
    { x: 5, y: 50 },  // GK
    { x: 25, y: 20 }, // LB
    { x: 25, y: 50 }, // CB
    { x: 25, y: 80 }, // RB
    { x: 50, y: 50 }, // CM
    { x: 75, y: 30 }, // ST1
    { x: 75, y: 70 }, // ST2
  ],
};

export const FORMATION_DETAILS: Record<Formation, { title: string; role: string; movement: string; position: string }[]> = {
  '2-3-1': [
    { position: 'GK', title: 'Thủ môn', role: 'Bảo vệ khung thành, phát động tấn công nhanh.', movement: 'Trong vòng cấm.' },
    { position: 'LB', title: 'Hậu vệ trái', role: 'Phòng ngự biên và hỗ trợ tấn công cánh.', movement: 'Dọc hành lang trái.' },
    { position: 'RB', title: 'Hậu vệ phải', role: 'Phòng ngự biên và hỗ trợ tấn công cánh.', movement: 'Dọc hành lang phải.' },
    { position: 'LM', title: 'Tiền vệ trái', role: 'Bám biên, tạt bóng và xâm nhập vòng cấm.', movement: 'Nửa sân đối phương, cánh trái.' },
    { position: 'CM', title: 'Tiền vệ trung tâm', role: 'Điều tiết nhịp độ và thu hồi bóng.', movement: 'Khu vực giữa sân.' },
    { position: 'RM', title: 'Tiền vệ phải', role: 'Bám biên, tạt bóng và dứt điểm.', movement: 'Nửa sân đối phương, cánh phải.' },
    { position: 'ST', title: 'Tiền đạo cắm', role: 'Ghi bàn và làm tường cho tuyến hai.', movement: 'Vòng cấm đối phương.' },
  ],
  '3-2-1': [
    { position: 'GK', title: 'Thủ môn', role: 'Bảo vệ khung thành, chỉ huy hàng thủ.', movement: 'Trong vòng cấm.' },
    { position: 'LB', title: 'Hậu vệ trái', role: 'Phòng ngự biên, ít dâng cao.', movement: 'Khu vực sân nhà bên trái.' },
    { position: 'CB', title: 'Trung vệ thòng', role: 'Bọc lót và chỉ huy hàng phòng ngự.', movement: 'Trung lộ sân nhà.' },
    { position: 'RB', title: 'Hậu vệ phải', role: 'Phòng ngự biên, giữ vị trí.', movement: 'Khu vực sân nhà bên phải.' },
    { position: 'CM1', title: 'Tiền vệ trung tâm 1', role: 'Thu hồi bóng và đánh chặn từ xa.', movement: 'Giữa sân, lệch trái.' },
    { position: 'CM2', title: 'Tiền vệ trung tâm 2', role: 'Phát động tấn công và hỗ trợ tiền đạo.', movement: 'Giữa sân, lệch phải.' },
    { position: 'ST', title: 'Tiền đạo cắm', role: 'Độc lập tác chiến, tận dụng cơ hội.', movement: 'Khu vực 1/3 sân đối phương.' },
  ],
  '2-1-2-1': [
    { position: 'GK', title: 'Thủ môn', role: 'Bảo vệ khung thành, chơi chân tốt.', movement: 'Trong vòng cấm.' },
    { position: 'LB', title: 'Hậu vệ trái', role: 'Phòng ngự và dâng cao hỗ trợ.', movement: 'Dọc biên trái.' },
    { position: 'RB', title: 'Hậu vệ phải', role: 'Phòng ngự và dâng cao hỗ trợ.', movement: 'Dọc biên phải.' },
    { position: 'CDM', title: 'Tiền vệ mỏ neo', role: 'Quét sạch khu vực trước vòng cấm.', movement: 'Trước hàng phòng ngự.' },
    { position: 'RAM', title: 'Tiền vệ công phải', role: 'Sáng tạo và dứt điểm từ cánh phải.', movement: 'Nửa sân đối phương, trung lộ phải.' },
    { position: 'LAM', title: 'Tiền vệ công trái', role: 'Sáng tạo và dứt điểm từ cánh trái.', movement: 'Nửa sân đối phương, trung lộ trái.' },
    { position: 'ST', title: 'Tiền đạo mục tiêu', role: 'Dứt điểm và thu hút hậu vệ.', movement: 'Vòng cấm đối phương.' },
  ],
  '3-1-2': [
    { position: 'GK', title: 'Thủ môn', role: 'Bảo vệ khung thành.', movement: 'Trong vòng cấm.' },
    { position: 'LB', title: 'Hậu vệ trái', role: 'Phòng ngự biên chắc chắn.', movement: 'Sân nhà bên trái.' },
    { position: 'CB', title: 'Trung vệ', role: 'Đánh chặn trực diện.', movement: 'Trung lộ sân nhà.' },
    { position: 'RB', title: 'Hậu vệ phải', role: 'Phòng ngự biên chắc chắn.', movement: 'Sân nhà bên phải.' },
    { position: 'CM', title: 'Tiền vệ điều tiết', role: 'Cầu nối giữa thủ và công.', movement: 'Vòng tròn trung tâm.' },
    { position: 'ST1', title: 'Tiền đạo trái', role: 'Di chuyển rộng, kéo dãn đội hình.', movement: 'Hàng công lệch trái.' },
    { position: 'ST2', title: 'Tiền đạo phải', role: 'Chớp thời cơ ghi bàn.', movement: 'Hàng công lệch phải.' },
  ],
};

export const INITIAL_PLAYERS: Player[] = [
  { 
    id: '1', name: 'Tuấn', number: 1, position: 'GK', 
    positionTitle: 'Thủ môn', 
    role: 'Bảo vệ khung thành, chỉ huy hàng thủ và phát động tấn công nhanh.',
    movement: 'Giới hạn trong vòng cấm, chủ yếu di chuyển ngang khung thành.',
    x: 5, y: 50, stats: { stamina: 80, speed: 60, passing: 85, defense: 92, attack: 10, morale: 85 }, status: 'active', errors: 0, rating: 8.5 
  },
  { 
    id: '2', name: 'Huy', number: 2, position: 'CB', 
    positionTitle: 'Hậu vệ thòng', 
    role: 'Đánh chặn, bọc lót cho hai cánh và tổ chức phòng ngự từ xa.',
    movement: 'Khu vực sân nhà, ít khi dâng cao quá vạch giữa sân.',
    x: 25, y: 30, stats: { stamina: 85, speed: 78, passing: 82, defense: 95, attack: 40, morale: 90 }, status: 'active', errors: 1, rating: 7.8 
  },
  { 
    id: '3', name: 'Kiệt', number: 4, position: 'LB', 
    positionTitle: 'Hậu vệ cánh trái', 
    role: 'Phòng ngự biên, hỗ trợ tấn công bằng các quả tạt hoặc leo biên.',
    movement: 'Dọc hành lang cánh trái, từ sân nhà đến sát đường biên ngang đối phương.',
    x: 25, y: 70, stats: { stamina: 92, speed: 85, passing: 84, defense: 80, attack: 75, morale: 88 }, status: 'active', errors: 0, rating: 8.2 
  },
  { 
    id: '4', name: 'Nghiệp', number: 7, position: 'RB', 
    positionTitle: 'Hậu vệ cánh phải', 
    role: 'Phòng ngự biên, chồng cánh và phối hợp với tiền vệ cánh.',
    movement: 'Dọc hành lang cánh phải, linh hoạt giữa thủ và công.',
    x: 50, y: 20, stats: { stamina: 88, speed: 82, passing: 94, defense: 75, attack: 80, morale: 85 }, status: 'active', errors: 2, rating: 6.5 
  },
  { 
    id: '5', name: 'Văn Anh', number: 8, position: 'CM', 
    positionTitle: 'Tiền vệ trung tâm', 
    role: 'Điều tiết nhịp độ trận đấu, thu hồi bóng và phân phối cho tuyến trên.',
    movement: 'Khu vực giữa sân, bao phủ cả chiều ngang và dọc trung lộ.',
    x: 50, y: 50, stats: { stamina: 90, speed: 84, passing: 88, defense: 70, attack: 82, morale: 85 }, status: 'active', errors: 0, rating: 8.0 
  },
  { 
    id: '6', name: 'Hùng', number: 10, position: 'AM', 
    positionTitle: 'Tiền vệ công', 
    role: 'Sáng tạo, kiến tạo cơ hội và dứt điểm từ xa hoặc xâm nhập vòng cấm.',
    movement: 'Khu vực 1/3 sân đối phương, tự do di chuyển tìm khoảng trống.',
    x: 50, y: 80, stats: { stamina: 85, speed: 75, passing: 90, defense: 50, attack: 85, morale: 92 }, status: 'active', errors: 1, rating: 7.5 
  },
  { 
    id: '7', name: 'Thái', number: 9, position: 'ST', 
    positionTitle: 'Tiền đạo cắm', 
    role: 'Ghi bàn, làm tường và gây áp lực lên hàng thủ đối phương.',
    movement: 'Khu vực vòng cấm đối phương, ít khi lùi sâu về sân nhà.',
    x: 80, y: 50, stats: { stamina: 82, speed: 90, passing: 75, defense: 40, attack: 88, morale: 85 }, status: 'active', errors: 0, rating: 8.8 
  },
];

export const SUBSTITUTES: Player[] = [
  { 
    id: '8', name: 'Hòa', number: 12, position: 'GK', 
    positionTitle: 'Thủ môn (Dự bị)', 
    role: 'Sẵn sàng thay thế và chỉ huy hàng thủ.',
    movement: 'Trong vòng cấm.',
    x: 0, y: 0, stats: { stamina: 75, speed: 55, passing: 70, defense: 85, attack: 5, morale: 80 }, status: 'sub' 
  },
  { 
    id: '9', name: 'Hoàng BĐ', number: 3, position: 'CB', 
    positionTitle: 'Trung vệ (Dự bị)', 
    role: 'Phòng ngự chắc chắn, bọc lót tốt.',
    movement: 'Sân nhà.',
    x: 0, y: 0, stats: { stamina: 80, speed: 70, passing: 75, defense: 88, attack: 30, morale: 85 }, status: 'sub' 
  },
  { 
    id: '10', name: 'Duy LM', number: 6, position: 'CM', 
    positionTitle: 'Tiền vệ (Dự bị)', 
    role: 'Điều tiết và thu hồi bóng.',
    movement: 'Giữa sân.',
    x: 0, y: 0, stats: { stamina: 85, speed: 75, passing: 82, defense: 75, attack: 70, morale: 82 }, status: 'sub' 
  },
  { 
    id: '11', name: 'Hoàng-Bé', number: 11, position: 'LM', 
    positionTitle: 'Tiền vệ cánh (Dự bị)', 
    role: 'Tốc độ và lắt léo bên hành lang cánh.',
    movement: 'Dọc biên.',
    x: 0, y: 0, stats: { stamina: 82, speed: 88, passing: 78, defense: 45, attack: 75, morale: 85 }, status: 'sub' 
  },
  { 
    id: '12', name: 'Hoàng lớn', number: 14, position: 'RM', 
    positionTitle: 'Tiền vệ cánh (Dự bị)', 
    role: 'Tạt bóng và hỗ trợ tấn công.',
    movement: 'Dọc biên.',
    x: 0, y: 0, stats: { stamina: 80, speed: 82, passing: 80, defense: 50, attack: 72, morale: 80 }, status: 'sub' 
  },
  { 
    id: '13', name: 'Duy', number: 15, position: 'LM', 
    positionTitle: 'Tiền vệ cánh (Dự bị)', 
    role: 'Kỹ thuật và sáng tạo.',
    movement: 'Dọc biên.',
    x: 0, y: 0, stats: { stamina: 78, speed: 80, passing: 85, defense: 40, attack: 78, morale: 88 }, status: 'sub' 
  },
  { 
    id: '14', name: 'Long', number: 16, position: 'ST', 
    positionTitle: 'Tiền đạo (Dự bị)', 
    role: 'Chớp thời cơ và dứt điểm.',
    movement: 'Vòng cấm đối phương.',
    x: 0, y: 0, stats: { stamina: 75, speed: 85, passing: 70, defense: 30, attack: 82, morale: 82 }, status: 'sub' 
  },
  { 
    id: '15', name: 'Tiến', number: 17, position: 'ST', 
    positionTitle: 'Tiền đạo (Dự bị)', 
    role: 'Sức mạnh và càn lướt.',
    movement: 'Vòng cấm đối phương.',
    x: 0, y: 0, stats: { stamina: 80, speed: 80, passing: 65, defense: 35, attack: 85, morale: 85 }, status: 'sub' 
  },
];
