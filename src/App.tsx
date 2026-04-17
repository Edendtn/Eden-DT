import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Printer, 
  Settings2, 
  Thermometer, 
  Droplets, 
  Zap, 
  FileText,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronLeft,
  Calculator,
  Download,
  ExternalLink,
  History,
  Save,
  Trash2,
  Copy,
  RotateCcw,
  Plus,
  Edit,
  Loader2,
  Menu,
  X,
  Globe,
  Settings,
  LogIn,
  LogOut,
  Mail,
  User as UserIcon,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2pdf from 'html2pdf.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Firebase ---
import { 
  auth, 
  db, 
  googleProvider, 
  syncUserProfile, 
  handleFirestoreError, 
  OperationType,
  UserProfile
} from './firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  addDoc,
  deleteDoc
} from 'firebase/firestore';

// --- Types ---
type SystemType = 'CHILLER' | 'COOLING_TOWER';
type Language = 'VI' | 'EN';
type ActiveTab = 'intro' | 'editor' | 'consumption' | 'history' | 'settings' | 'admin';

const TRANSLATIONS = {
  VI: {
    sidebar: {
      title: 'CULLIGAN',
      intro: 'Giới thiệu',
      editor: 'Trình chỉnh sửa',
      history: 'Danh mục lưu trữ',
      saveSuccess: 'Đã lưu proposal thành công!',
      deleteConfirm: 'Bạn có chắc chắn muốn xóa proposal này?',
      noHistory: 'Chưa có proposal nào được lưu',
      saveHint: 'Bấm biểu tượng để lưu bản nháp hiện tại',
      print: 'IN / XUẤT PDF',
      openNewTab: 'MỞ TRONG TAB MỚI',
      chiller: 'Chiller',
      cooling: 'Giải nhiệt',
      historyTitle: 'LỊCH SỬ PROPOSALS',
      noCustomer: 'Chưa đặt tên khách hàng',
      reset: 'KHÔI PHỤC MẶC ĐỊNH',
      saveProposal: 'Lưu Proposal',
      systemType: 'LOẠI HỆ THỐNG',
      consumption: 'Tiêu thụ',
    },
    sections: {
      general: 'Thông tin chung',
      specs: 'Thông số hệ thống',
      chemistry: 'Chỉ số nước (Đo đạc)',
      makeup: 'Nước bổ sung',
      chemicals: 'Hóa chất (Liều lượng)',
      recommendations: 'Khuyến nghị kỹ thuật',
      notes: 'Ghi chú vận hành',
      introContent: 'Nội dung giới thiệu',
    },
    labels: {
      pageNumber: 'Trang',
      customer: 'Khách hàng',
      project: 'Dự án',
      reportId: 'Mã báo cáo',
      date: 'Ngày',
      madeBy: 'Người thực hiện',
      summaryTitle: 'Tiêu đề tóm tắt',
      summaryValue: 'Giá trị tóm tắt',
      summaryUnit: 'Đơn vị tóm tắt',
      equipment: 'Tên thiết bị',
      material: 'Vật liệu',
      volume: 'Thể tích hệ thống',
      capacity: 'Công suất thiết kế',
      flow: 'Lưu lượng tuần hoàn',
      load: 'Tải hoạt động',
      coc: 'Hệ số COC',
      hours: 'Thời gian hoạt động',
      operatingDays: 'Số ngày hoạt động',
      tempIn: 'Nhiệt độ vào',
      tempOut: 'Nhiệt độ ra',
      leakage: 'Rò rỉ hệ thống',
      makeupVol: 'Lượng nước bổ sung',
      dosage: 'Liều dùng (ppm)',
      title: 'Tiêu đề',
      content: 'Nội dung',
      noteContent: 'Nội dung ghi chú',
      conductivity: 'Độ dẫn điện',
      hardness: 'Độ cứng',
      silica: 'Silica',
      iron: 'Sắt (Fe)',
      copper: 'Đồng (Cu)',
      bacteria: 'Vi khuẩn',
      phosphate: 'Phosphate',
      nitrite: 'Nitrite',
      sulfate: 'Sulfate',
      cuCorrTower: 'COPPER CORRO. RATE',
      msCorrTower: 'MID STEEL CORRO. RATE',
      turbidity: 'Độ đục (NTU)',
      cuCorr: 'COPPER CORRO. RATE',
      msCorr: 'MID STEEL CORRO. RATE',
      deltaT: 'Chênh lệch nhiệt',
      efficiency: 'Hiệu suất',
      powerInput: 'Điện năng tiêu thụ',
      makeupType: 'Type',
      makeupTypeChiller: 'Makeup type',
      phLevel: 'Chỉ số pH',
      alkalinity: 'Độ kiềm (M-Alk)',
      lsiIndex: 'Chỉ số LSI',
      samplingDate: 'Ngày lấy mẫu',
      chlorides: 'Clorua (Cl-)',
      freeChloride: 'Clo dư (Free Chloride)',
      cycle: 'Hệ số cô đặc (Cycle)',
      total: 'Tổng cộng',
      consumptionReport: 'BÁO CÁO TIÊU THỤ',
      consumptionSubtitle: 'TỔNG HỢP LƯỢNG HÓA CHẤT TIÊU THỤ',
      system: 'Hệ thống',
      quantity: 'Số lượng',
      runningQty: 'SL Chạy',
      totalYearly: 'Tổng {name} (kg/năm)',
      chemicalFunctions: 'Chức năng hóa chất',
      coolingTitle: 'Tiêu thụ hệ thống nước giải nhiệt',
      chillerTitle: 'Tiêu thụ hệ thống nước Chiller',
      kgMonth: 'kg/tháng',
      descTotalGuard: 'Hóa chất ức chế ăn mòn và cáu cặn đa năng cho hệ thống giải nhiệt hở.',
      descDepositGuard: 'Hóa chất ức chế cáu cặn và phân tán bùn sét, ngăn ngừa lắng đọng.',
      descBioGuard41: 'Hóa chất diệt khuẩn dạng oxy hóa mạnh, kiểm soát rong rêu và vi sinh vật.',
      descBioGuard40: 'Culligan Bio Guard 40H16: Hóa chất diệt khuẩn dạng không oxy hóa, hiệu quả cao trong việc kiểm soát màng sinh học.',
      descCorroGuard: 'Hóa chất ức chế ăn mòn và cáu cặn chuyên dụng cho hệ thống nước lạnh kín (Chilled water).',
      descBioGuard40Chiller: 'Culligan Bio Guard 40H16: Hóa chất diệt khuẩn không oxy hóa, kiểm soát vi sinh vật và màng sinh học trong hệ thống kín.',
    },
    intro: {
      heritage: 'DI SẢN CULLIGAN',
      since: 'Từ năm 1921',
      distributor: 'nhà phân phối đại diện Culligan',
      aboutTitle: 'Culligan - Chuyên gia Xử lý Nước Công nghiệp',
      aboutText: 'Với hơn 100 năm kinh nghiệm, Culligan là đối tác tin cậy trong việc cung cấp các giải pháp xử lý nước toàn diện. Chúng tôi kết hợp giữa thiết bị tiên tiến và hóa chất chuyên dụng để tối ưu hóa hiệu suất hệ thống.',
      coolingFocusTitle: 'KIỂM SOÁT NƯỚC GIẢI NHIỆT',
      coolingFocusText: 'Giải pháp hóa chất của Culligan tập trung vào việc giải quyết 4 thách thức cốt lõi trong hệ thống tháp giải nhiệt và chiller:',
      solutionsTitle: 'CÁC LĨNH VỰC KIỂM SOÁT CHÍNH',
      scale: {
        title: 'Kiểm soát Cáu cặn',
        desc: 'Ngăn ngừa sự tích tụ khoáng chất trên bề mặt trao đổi nhiệt, duy trì hiệu suất truyền nhiệt tối đa.'
      },
      corrosion: {
        title: 'Kiểm soát Ăn mòn',
        desc: 'Bảo vệ các bề mặt kim loại khỏi sự xuống cấp, kéo dài tuổi thọ thiết bị và giảm chi phí bảo trì.'
      },
      fouling: {
        title: 'Kiểm soát Lắng đọng',
        desc: 'Sử dụng các chất phân tán để giữ cho các chất lơ lửng không bị lắng đọng, ngăn ngừa tắc nghẽn.'
      },
      microbio: {
        title: 'Kiểm soát Vi sinh',
        desc: 'Sử dụng các chất diệt khuẩn để ngăn ngừa màng sinh học và sự phát triển của vi khuẩn có hại.'
      }
    },
    units: {
      m3: 'm³',
      m3h: 'm³/h',
      rt: 'RT',
      percent: '%',
      hoursPerDay: 'h/ngày',
      daysPerMonth: 'ngày/tháng',
      percentPerMonth: '%/tháng',
      celsius: '°C',
    },
    chiller: {
      return: 'CHWR',
      supply: 'CHWS',
      cwReturn: 'CW Return',
      cwSupply: 'CW Supply',
      unit: '',
    },
    report: {
      reportId: 'MÃ SỐ BÁO CÁO',
      titleChiller: 'TECHNICAL PROPOSAL',
      titleCooling: 'TECHNICAL PROPOSAL',
      subtitleChiller: 'CHILLER WATER TREATMENT SYSTEM',
      subtitleCooling: 'COOLING WATER TREATMENT SYSTEM',
      customerInfo: 'THÔNG TIN KHÁCH HÀNG',
      systemSpecs: 'THÔNG SỐ HỆ THỐNG',
      sectionChiller: 'Hệ thống Chiller',
      sectionCooling: 'Hệ Thống Tháp Giải Nhiệt',
      operatingStatus: 'TRẠNG THÁI VẬN HÀNH',
      operatingData: 'DỮ LIỆU VẬN HÀNH',
      waterSystem: 'HỆ THỐNG NƯỚC',
      diagramChiller: 'Sơ đồ hệ chiller',
      diagramTower: 'Sơ đồ cân bằng tháp giải nhiệt',
      evaporation: 'Bay hơi',
      makeup: 'Bổ sung',
      blowdown: 'Xả đáy',
      drift: 'Thất thoát',
      recirculation: 'Tuần hoàn',
      waterAnalysisChiller: 'Chất lượng nước và tiêu chuẩn kiểm soát nước chiller',
      waterAnalysisCooling: 'Chất lượng nước và tiêu chuẩn kiểm soát nước giải nhiệt',
      chemicalProgram: 'Chương trình hóa chất xử lý',
      chemical: 'Hóa chất',
      kgInitial: 'Kg/Lần\n(*)',
      kgDay: 'Kg/D',
      kgMonth: 'Kg/M',
      kgYear: 'Kg/Y',
      techRecommendations: 'Khuyến nghị kỹ thuật',
      waterStandardNote: '* Ghi chú: Tiêu chuẩn được thiết lập dựa trên chất lượng nước cấp bổ sung và kinh nghiệm Culligan',
    },
    chemicals: {
      corrosionScale: 'Kiểm soát ngăn ngừa ăn mòn cáu cặn',
      microbiological: 'Kiểm soát vi sinh',
      scaleCorrosion: 'Kiểm soát cáu cặn và ăn mòn',
      dispersant: 'Chất phân tán',
      oxidizing: 'Diệt vi sinh oxy hóa',
      nonOxidizing: 'Diệt vi sinh không oxy hóa',
    },
    defaults: {
      chillerNotes: "Cách châm hóa chất:\n+ Culligan Corro Guard 33L01: châm định kì hằng tháng bằng thiết bị theo chỉ dẫn\n+ Culligan Bio Guard 40H16: châm định kì hằng tuần/tháng bằng thiết bị theo chỉ dẫn\n*kg/lần: chỉ áp dụng cho những hệ thống mới\n\nHóa chất được tính toán cho hệ thống hoạt động 24giờ/ ngày, 30 ngày/ tháng.\nDuy trì nồng độ hóa chất theo đúng hướng dẫn kỹ thuật.\nKiểm tra định kỳ các thông số nước 1 lần/tuần.\nKiểm tra vệ sinh hệ thống châm hóa chất định kỳ hàng tháng",
      towerNotes: "Cách châm hóa chất:\n+ Culligan Total Guard 20C04: châm liên tục, hệ thống châm\n+ Culligan Bio Guard 41H01: châm liên tục bằng hệ thống châm hoặc châm tay theo chỉ dẫn.\n+ Culligan Bio Guard 40H16: châm tay theo chỉ dẫn.\n+ Hóa chất khác (nếu có): châm liên tục bằng hệ thống châm hoặc châm tay theo chỉ dẫn.\n\nHóa chất được tính toán cho hệ thống hoạt động 24giờ/ ngày, 30 ngày/ tháng.\nDuy trì nồng độ hóa chất theo đúng hướng dẫn kỹ thuật.\nKiểm tra định kỳ các thông số nước 1 lần/tuần.\nKiểm tra vệ sinh hệ thống châm hóa chất định kỳ hàng tháng",
      chillerRecs: [
        { title: "LEAKAGE CHECK", desc: "If the actual make-up water volume exceeds normal leakage rates, a thorough inspection of pipeline leak points or metering pump seals is required" },
        { title: "INSPECTION FREQUENCY", desc: "Chiller water samples must be collected for analysis at least twice per month to monitor the maintained concentration of Nitrite" },
        { title: "BIOCIDE MAINTENANCE", desc: "Ensure periodic dosing of Bio Guard 40H16 to prevent microbial ingress via make-up water and to mitigate the depletion of nitrite levels caused by nitrifying bacteria" },
        { title: "CHILLER MAINTENANCE", desc: "Monitor heat exchange efficiency to ensure the approach temperature (LTD) remains below a maximum of 4°C, and perform intensive mechanical cleaning or chemical CIP (Cleaning-in-Place) if necessary" }
      ],
      towerRecs: [
        { title: "CLEANING TOWER", desc: "Clean and flush the bottom of the tower every three (03) months to remove sludge and organic sediment adt \"dead zones\" (hidden corners)" },
        { title: "CONTROL BLOWDOWN", desc: "The automatic drain valve adjusts based on conductivity maintaining COC 10 - 12" },
        { title: "DISINFECTANT DOSAGE", desc: "Increase the dosage of disinfectant shock during the rainy season or when the water temperature is high." },
        { title: "MAINTENANCE", desc: "Monthly calibration of pH and Conductivity sensors ensures accuracy; Check the chemical dosing units." }
      ],
      summaryTitle: 'Chỉ số hiệu quả hệ thống',
    }
  },
  EN: {
    sidebar: {
      title: 'CULLIGAN',
      intro: 'Introduction',
      editor: 'Editor',
      history: 'History',
      saveSuccess: 'Proposal saved successfully!',
      deleteConfirm: 'Are you sure you want to delete this proposal?',
      noHistory: 'No proposals saved yet',
      saveHint: 'Click the icon to save current draft',
      print: 'PRINT / EXPORT PDF',
      openNewTab: 'OPEN IN NEW TAB',
      chiller: 'Chiller',
      cooling: 'Cooling',
      historyTitle: 'PROPOSAL HISTORY',
      noCustomer: 'No customer name',
      reset: 'RESET TO DEFAULTS',
      saveProposal: 'Save Proposal',
      systemType: 'SYSTEM TYPE',
      consumption: 'Consumption',
    },
    sections: {
      general: 'General Info',
      specs: 'System Specs',
      chemistry: 'Water Chemistry (Measured)',
      makeup: 'Makeup Water',
      chemicals: 'Chemicals (Dosage)',
      recommendations: 'Technical Recommendations',
      notes: 'Operating Notes',
      introContent: 'Intro Content',
    },
    labels: {
      pageNumber: 'Page',
      customer: 'Customer',
      project: 'Project',
      reportId: 'Report ID',
      date: 'Date',
      madeBy: 'MADE BY',
      summaryTitle: 'Summary Title',
      summaryValue: 'Summary Value',
      summaryUnit: 'Summary Unit',
      equipment: 'Equipment Name',
      material: 'Material',
      volume: 'System Volume',
      capacity: 'Design Capacity',
      flow: 'Circulation Flow',
      load: 'Operating Load',
      coc: 'COC Factor',
      hours: 'Operating Hours',
      operatingDays: 'Operating Days',
      tempIn: 'Temp In',
      tempOut: 'Temp Out',
      leakage: 'System Leakage',
      makeupVol: 'Makeup Volume',
      dosage: 'Dosage (ppm)',
      title: 'Title',
      content: 'Content',
      noteContent: 'Note Content',
      conductivity: 'Conductivity',
      hardness: 'Total Hardness',
      silica: 'Silica (SiO2)',
      iron: 'Iron (Fe)',
      copper: 'Copper (Cu)',
      bacteria: 'Bacteria',
      phosphate: 'Phosphate (PO4)',
      nitrite: 'Nitrite (NO2)',
      sulfate: 'Sulfate',
      cuCorrTower: 'COPPER CORRO. RATE',
      msCorrTower: 'MID STEEL CORRO. RATE',
      turbidity: 'Turbidity (NTU)',
      cuCorr: 'COPPER CORRO. RATE',
      msCorr: 'MID STEEL CORRO. RATE',
      deltaT: 'Delta T',
      efficiency: 'Efficiency',
      powerInput: 'Power Input',
      makeupType: 'Type',
      makeupTypeChiller: 'Makeup type',
      phLevel: 'pH Level',
      alkalinity: 'M-Alkalinity',
      lsiIndex: 'LSI Index',
      samplingDate: 'Sampling Date',
      chlorides: 'Chlorides (Cl-)',
      freeChloride: 'Free Chloride',
      cycle: 'Cycle',
      total: 'Total',
      consumptionReport: 'CONSUMPTION REPORT',
      consumptionSubtitle: 'CHEMICAL CONSUMPTION SUMMARY',
      system: 'System',
      quantity: 'Quantity',
      runningQty: 'Running Qty',
      totalYearly: 'Total {name} (kg/year)',
      chemicalFunctions: 'Chemical Functions',
      coolingTitle: 'Cooling Water Systems Consumption',
      chillerTitle: 'Chiller Water Systems Consumption',
      kgMonth: 'kg/month',
      descTotalGuard: 'Multipurpose corrosion and scale inhibitor for open cooling systems.',
      descDepositGuard: 'Scale inhibitor and dispersant for cooling systems, preventing deposits.',
      descBioGuard41: 'Strong oxidizing biocide, controls algae and microorganisms.',
      descBioGuard40: 'Culligan Bio Guard 40H16: Non-oxidizing biocide, highly effective in biofilm control.',
      descCorroGuard: 'Specialized corrosion and scale inhibitor for closed chilled water systems.',
      descBioGuard40Chiller: 'Culligan Bio Guard 40H16: Non-oxidizing biocide, highly effective in biofilm control.',
    },
    intro: {
      heritage: 'CULLIGAN HERITAGE',
      since: 'Since 1921',
      distributor: 'Authorized Culligan Partner',
      aboutTitle: 'Culligan - Industrial Water Treatment Experts',
      aboutText: 'With over 100 years of global expertise, Culligan is a trusted partner in providing comprehensive water treatment solutions. We integrate advanced equipment with specialized chemicals to maximize system performance and longevity.',
      coolingFocusTitle: 'COOLING WATER SOLUTIONS',
      coolingFocusText: 'Culligan\'s chemical solutions focus on addressing the four core challenges in cooling tower and chiller systems:',
      solutionsTitle: 'CORE AREAS OF CONTROL',
      scale: {
        title: 'Scale Control',
        desc: 'Preventing mineral buildup on heat exchange surfaces to maintain maximum thermal efficiency.'
      },
      corrosion: {
        title: 'Corrosion Control',
        desc: 'Protecting metal surfaces from degradation, extending equipment life and reducing maintenance costs.'
      },
      fouling: {
        title: 'Fouling Control',
        desc: 'Utilizing dispersants to keep suspended solids from settling and preventing system blockages.'
      },
      microbio: {
        title: 'Microbiological Control',
        desc: 'Implementing biocides to prevent biofilm formation and the growth of harmful pathogens.'
      }
    },
    units: {
      m3: 'm³',
      m3h: 'm³/h',
      rt: 'RT',
      percent: '%',
      hoursPerDay: 'h/day',
      daysPerMonth: 'd/month',
      percentPerMonth: '%/month',
      celsius: '°C',
    },
    chiller: {
      return: 'CHWR',
      supply: 'CHWS',
      cwReturn: 'CW Return',
      cwSupply: 'CW Supply',
      unit: '',
    },
    report: {
      reportId: 'REPORT ID',
      titleChiller: 'TECHNICAL PROPOSAL',
      titleCooling: 'TECHNICAL PROPOSAL',
      subtitleChiller: 'CHILLER WATER TREATMENT SYSTEM',
      subtitleCooling: 'COOLING WATER TREATMENT SYSTEM',
      customerInfo: 'CUSTOMER INFORMATION',
      systemSpecs: 'SYSTEM SPECIFICATIONS',
      sectionChiller: 'Chiller System',
      sectionCooling: 'Cooling Tower System',
      operatingStatus: 'OPERATING STATUS',
      operatingData: 'OPERATING DATA',
      waterSystem: 'WATER SYSTEM',
      diagramChiller: 'Chiller System Diagram',
      diagramTower: 'Cooling Tower Balance Diagram',
      evaporation: 'Evaporation',
      makeup: 'Makeup',
      blowdown: 'Blowdown',
      drift: 'Drift',
      recirculation: 'Recirculation',
      waterAnalysisChiller: 'Water Quality & Control Standards for Chiller',
      waterAnalysisCooling: 'Water Quality & Control Standards for Cooling',
      chemicalProgram: 'Chemical Treatment Program',
      chemical: 'Chemical',
      kgInitial: 'Initial\n(*)',
      kgDay: 'Kg/D',
      kgMonth: 'Kg/M',
      kgYear: 'Kg/Y',
      techRecommendations: 'Technical Recommendations',
      waterStandardNote: '* Note: Standards are established based on makeup water quality and Culligan experience',
    },
    chemicals: {
      corrosionScale: 'Corrosion & Scale Control',
      microbiological: 'Microbiological Control',
      scaleCorrosion: 'Scale & Corrosion Control',
      dispersant: 'Dispersant',
      oxidizing: 'Oxidizing Biocide',
      nonOxidizing: 'Non-Oxidizing Biocide',
    },
    defaults: {
      chillerNotes: "Chemical Dosing Method:\n+ Culligan Corro Guard 33L01: Dose monthly using equipment as instructed\n+ Culligan Bio Guard 40H16: Dose weekly/monthly using equipment as instructed\n*kg/initial: Only applies to new systems\n\nChemicals calculated for 24h/day, 30 days/month operation.\nMaintain chemical concentration according to technical instructions.\nPeriodically check water parameters once a week.\nPeriodically check and clean chemical dosing system monthly",
      towerNotes: "Chemical Dosing Method:\n+ Culligan Total Guard 20C04: Continuous dosing, dosing system\n+ Culligan Bio Guard 41H01: Continuous dosing by system or manual as instructed.\n+ Culligan Bio Guard 40H16: Manual dosing as instructed.\n+ Other chemicals (if any): Continuous dosing by system or manual as instructed.\n\nChemicals calculated for 24h/day, 30 days/month operation.\nMaintain chemical concentration according to technical instructions.\nPeriodically check water parameters once a week.\nPeriodically check and clean chemical dosing system monthly",
      chillerRecs: [
        { title: "LEAKAGE CHECK", desc: "If the actual make-up water volume exceeds normal leakage rates, a thorough inspection of pipeline leak points or metering pump seals is required" },
        { title: "INSPECTION FREQUENCY", desc: "Chiller water samples must be collected for analysis at least twice per month to monitor the maintained concentration of Nitrite" },
        { title: "BIOCIDE MAINTENANCE", desc: "Ensure periodic dosing of Bio Guard 40H16 to prevent microbial ingress via make-up water and to mitigate the depletion of nitrite levels caused by nitrifying bacteria" },
        { title: "CHILLER MAINTENANCE", desc: "Monitor heat exchange efficiency to ensure the approach temperature (LTD) remains below a maximum of 4°C, and perform intensive mechanical cleaning or chemical CIP (Cleaning-in-Place) if necessary" }
      ],
      towerRecs: [
        { title: "CLEANING TOWER", desc: "Clean and flush the bottom of the tower every three (03) months to remove sludge and organic sediment adt \"dead zones\" (hidden corners)" },
        { title: "CONTROL BLOWDOWN", desc: "The automatic drain valve adjusts based on conductivity maintaining COC 10 - 12" },
        { title: "DISINFECTANT DOSAGE", desc: "Increase the dosage of disinfectant shock during the rainy season or when the water temperature is high." },
        { title: "MAINTENANCE", desc: "Monthly calibration of pH and Conductivity sensors ensures accuracy; Check the chemical dosing units." }
      ],
      summaryTitle: 'System Efficiency Index',
    }
  }
};

interface ChemicalRow {
  name: string;
  type: string;
  dosage: number;
  kgDay: number;
  kgMonth: number;
  kgYear: number;
  kgInitial?: number;
}

interface Recommendation {
  title: string;
  desc: string;
}

interface ConsumptionSystem {
  name: string;
  quantity: number; // Số lượng
  operatingLoad: number; // Tải hoạt động (%)
  runningQuantity: number; // Số lượng chạy
  totalGuard: number; // Culligan Total Guard 20C04/20C23
  depositGuard: number; // Culligan Deposit Guard 22C55
  bioGuard41H01: number; // Culligan Bio Guard 41H01
  bioGuard40H16: number; // Culligan Bio Guard 40H16
  corroGuard33L01: number; // Culligan Corro Guard 33L01
}

interface ReportData {
  systemType: SystemType;
  customerName: string;
  projectName: string;
  reportId: string;
  engineerName: string;
  date: string;
  
  // System Specs
  equipmentName: string;
  material: string;
  operatingHours: number;
  operatingDaysPerMonth: number;
  capacityRT: number;
  circulationFlow: number; // m3/h
  tempIn: number; // C
  tempOut: number; // C
  powerInput: number; // kW
  systemVolume: number; // m3
  
  // Water Quality (Makeup)
  makeupType: string;
  makeupPh: number;
  makeupEc: number;
  makeupHardness: number;
  makeupMAlk: number;
  makeupSilica: number;
  makeupChloride: number;
  makeupSulfate: number;
  
  // Technical Standards (Measured)
  measuredPh: number;
  measuredConductivity: number;
  measuredHardness: number;
  measuredMAlk: number;
  measuredChlorides: number;
  measuredSilica: number;
  measuredBacteria: string;
  measuredIron: number;
  measuredCopper: number;
  measuredPhosphate: number;
  measuredLsi: number;
  measuredFreeChloride: number;
  cocLimit: string;
  measuredNitrite: number;
  measuredSulfate: number;
  measuredCopperCorrosion: number;
  measuredMildSteelCorrosion: number;
  measuredMildSteelCorrosionTower: number;
  measuredCopperCorrosionTower: number;
  measuredTurbidityTower: number;
  measuredCodTower: number;
  measuredBacteriaTower: string;
  samplingDate: string;
  samplingTimeHeader: string;
  samplingNote: string;
  systemLeakage: number;
  chillerMakeupVolume: string;
  manualLoadPercentage: number;
  summaryTitle: string;
  summaryValue: string;
  summaryUnit: string;
  coolingTotalGuardName: string;
  coolingDepositGuardName: string;
  coolingBioGuardName: string;
  coolingBioGuard40Name: string;
  chillerCorroGuardName: string;
  chillerBioGuardName: string;

  // Standards
  towerStandards: Record<string, string>;
  chillerStandards: Record<string, string>;

  // Chemicals
  chillerChemicals: ChemicalRow[];
  towerChemicals: ChemicalRow[];
  
  // Recommendations
  chillerRecommendations: Recommendation[];
  towerRecommendations: Recommendation[];
  
  // Constants/Factors
  coc: number; // Cycles of Concentration
  
  // Operating Notes
  chillerOperatingNotes: string;
  towerOperatingNotes: string;

  // Chemical Descriptions (Editable)
  descTotalGuard: string;
  descDepositGuard: string;
  descBioGuard41: string;
  descBioGuard40: string;
  descCorroGuard: string;
  descBioGuard40Chiller: string;

  // Consumption Data
  consumptionCooling: ConsumptionSystem[];
  consumptionChiller: ConsumptionSystem[];

  // Intro Content (Editable)
  introAboutTitle: string;
  introAboutText: string;
  introCoolingFocusTitle: string;
  introCoolingFocusText: string;
  introScaleTitle: string;
  introScaleDesc: string;
  introCorrosionTitle: string;
  introCorrosionDesc: string;
  introFoulingTitle: string;
  introFoulingDesc: string;
  introMicrobioTitle: string;
  introMicrobioDesc: string;
  pageNumber: string;
}

// --- Constants ---
const INITIAL_DATA: ReportData = {
  systemType: 'CHILLER',
  customerName: "VINAMILK FACTORY",
  projectName: "VN-CHILL-NORTH",
  reportId: "CH-2024-089",
  engineerName: "ENG. MINH TRAN",
  date: new Date().toLocaleDateString('en-GB'),
  pageNumber: "1/1",
  
  equipmentName: "York YK Centrifugal",
  material: "Copper / Carbon Steel / SUS",
  operatingHours: 24,
  operatingDaysPerMonth: 30,
  capacityRT: 1250,
  circulationFlow: 2440,
  tempIn: 34.8,
  tempOut: 30.0,
  powerInput: 450,
  systemVolume: 65,
  
  makeupType: "Softened Water",
  makeupPh: 7.8,
  makeupEc: 420,
  makeupHardness: 120,
  makeupMAlk: 150,
  makeupSilica: 22,
  makeupChloride: 45,
  makeupSulfate: 35,
  
  measuredPh: 8.2,
  measuredConductivity: 2100,
  measuredHardness: 450,
  measuredMAlk: 380,
  measuredChlorides: 280,
  measuredSilica: 120,
  measuredBacteria: "< 10^4",
  measuredIron: 0.6,
  measuredCopper: 0.05,
  measuredPhosphate: 8.5,
  measuredLsi: 1.2,
  measuredFreeChloride: 0.2,
  cocLimit: "10 - 12",
  measuredNitrite: 950,
  measuredSulfate: 15,
  measuredCopperCorrosion: 0.12,
  measuredMildSteelCorrosion: 0.35,
  measuredMildSteelCorrosionTower: 0.5,
  measuredCopperCorrosionTower: 0.1,
  measuredTurbidityTower: 5,
  measuredCodTower: 0,
  measuredBacteriaTower: "< 10^3",
  samplingDate: new Date().toLocaleDateString('en-GB'),
  samplingTimeHeader: "Result",
  samplingNote: "Mẫu được lấy ngày 28.03.2026",
  systemLeakage: 0.5,
  chillerMakeupVolume: "10 m3/month",
  manualLoadPercentage: 85,
  summaryTitle: "System Efficiency Index",
  summaryValue: "85.0",
  summaryUnit: "%",
  coolingTotalGuardName: "Culligan Total Guard 20C04",
  coolingDepositGuardName: "Culligan Deposit Guard 22C55",
  coolingBioGuardName: "Culligan Bio Guard 41H01",
  coolingBioGuard40Name: "Culligan Bio Guard 40H16",
  chillerCorroGuardName: "Culligan Corro Guard 33L01",
  chillerBioGuardName: "Culligan Bio Guard 40H16",

  towerStandards: {
    tempCoolingWater: "< 35",
    ph: "7.0 - 8.7",
    turbidity: "< 20",
    conductivity: "< 2500",
    hardness: "< 500",
    alkalinity: "< 350",
    iron: "< 2.0",
    silica: "< 150",
    chlorides: "trending",
    freeChloride: "0.1 - 0.3",
    bacteria: "max 50 x 10^4",
    cycle: "10 - 12",
    phosphate: "4.0 - 10.0",
    lsi: "0.5 - 2.0",
    msCorr: "< 3.0",
    cuCorr: "< 1.0",
    cod: "trending"
  },
  chillerStandards: {
    ph: "8.5 - 10.5",
    conductivity: "trending",
    alkalinity: "100 - 300",
    chlorides: "< 80",
    iron: "< 2.0",
    copper: "< 0.3",
    bacteria: "max 50 x 10^4",
    nitrite: "400 - 700",
    sulfate: "< 20",
    cuCorr: "0.25 max",
    msCorr: "0.5 max"
  },

  chillerChemicals: [
    { name: "Culligan Corro Guard 33L01", type: "corrosionScale", dosage: 0, kgDay: 0, kgMonth: 0, kgYear: 0, kgInitial: 0 },
    { name: "Culligan Bio Guard 40H16", type: "microbiological", dosage: 0, kgDay: 0, kgMonth: 0, kgYear: 0 }
  ],

  towerChemicals: [
    { name: "Culligan Total Guard 20C04", type: "scaleCorrosion", dosage: 0, kgDay: 0, kgMonth: 0, kgYear: 0 },
    { name: "Culligan Deposit Guard 22C55", type: "dispersant", dosage: 0, kgDay: 0, kgMonth: 0, kgYear: 0 },
    { name: "Culligan Bio Guard 41H01", type: "oxidizing", dosage: 0, kgDay: 0, kgMonth: 0, kgYear: 0 },
    { name: "Culligan Bio Guard 40H16", type: "nonOxidizing", dosage: 0, kgDay: 0, kgMonth: 0, kgYear: 0 }
  ],

  chillerRecommendations: [
    { title: "LEAKAGE CHECK", desc: "If the actual make-up water volume exceeds normal leakage rates, a thorough inspection of pipeline leak points or metering pump seals is required" },
    { title: "INSPECTION FREQUENCY", desc: "Chiller water samples must be collected for analysis at least twice per month to monitor the maintained concentration of Nitrite" },
    { title: "BIOCIDE MAINTENANCE", desc: "Ensure periodic dosing of Bio Guard 40H16 to prevent microbial ingress via make-up water and to mitigate the depletion of nitrite levels caused by nitrifying bacteria" },
    { title: "CHILLER MAINTENANCE", desc: "Monitor heat exchange efficiency to ensure the approach temperature (LTD) remains below a maximum of 4°C, and perform intensive mechanical cleaning or chemical CIP (Cleaning-in-Place) if necessary" }
  ],

  towerRecommendations: [
    { title: "CLEANING TOWER", desc: "Clean and flush the bottom of the tower every three (03) months to remove sludge and organic sediment adt \"dead zones\" (hidden corners)" },
    { title: "CONTROL BLOWDOWN", desc: "The automatic drain valve adjusts based on conductivity maintaining COC 10 - 12" },
    { title: "DISINFECTANT DOSAGE", desc: "Increase the dosage of disinfectant shock during the rainy season or when the water temperature is high." },
    { title: "MAINTENANCE", desc: "Monthly calibration of pH and Conductivity sensors ensures accuracy; Check the chemical dosing units." }
  ],
  
  coc: 10.0,
  
  chillerOperatingNotes: "Cách châm hóa chất:\n+ Culligan Corro Guard 33L01: châm định kì hằng tháng bằng thiết bị theo chỉ dẫn\n+ Culligan Bio Guard 40H16: châm định kì hằng tuần/tháng bằng thiết bị theo chỉ dẫn\n*kg/lần: chỉ áp dụng cho những hệ thống mới\n\nHóa chất được tính toán cho hệ thống hoạt động 24giờ/ ngày, 30 ngày/ tháng.\nDuy trì nồng độ hóa chất theo đúng hướng dẫn kỹ thuật.\nKiểm tra định kỳ các thông số nước 1 lần/tuần.\nKiểm tra vệ sinh hệ thống châm hóa chất định kỳ hàng tháng",
  
  towerOperatingNotes: "Cách châm hóa chất:\n+ Culligan Total Guard 20C04: châm liên tục, hệ thống châm\n+ Culligan Deposit Guard 22C55: châm liên tục, hệ thống châm\n+ Culligan Bio Guard 41H01: châm liên tục bằng hệ thống châm hoặc châm tay theo chỉ dẫn.\n+ Culligan Bio Guard 40H16: châm tay theo chỉ dẫn.\n+ Hóa chất khác (nếu có): châm liên tục bằng hệ thống châm hoặc châm tay theo chỉ dẫn.\n\nHóa chất được tính toán cho hệ thống hoạt động 24giờ/ ngày, 30 ngày/ tháng.\nDuy trì nồng độ hóa chất theo đúng hướng dẫn kỹ thuật.\nKiểm tra định kỳ các thông số nước 1 lần/tuần.\nKiểm tra vệ sinh hệ thống châm hóa chất định kỳ hàng tháng",
  
  consumptionCooling: [
    { name: "Tower 1", quantity: 1, operatingLoad: 80, runningQuantity: 1, totalGuard: 0, depositGuard: 0, bioGuard41H01: 0, bioGuard40H16: 0, corroGuard33L01: 0 },
  ],
  consumptionChiller: [
    { name: "Chiller 1", quantity: 1, operatingLoad: 80, runningQuantity: 1, totalGuard: 0, depositGuard: 0, bioGuard41H01: 0, bioGuard40H16: 0, corroGuard33L01: 0 },
  ],

  // Chemical Descriptions Defaults
  descTotalGuard: "Hóa chất ức chế ăn mòn và cáu cặn đa năng cho hệ thống giải nhiệt hở.",
  descDepositGuard: "Chất phân tán, ngăn ngừa lắng đọng cáu cặn cho hệ thống giải nhiệt.",
  descBioGuard41: "Diệt vi sinh oxy hóa, kiểm soát rong rêu và vi sinh vật.",
  descBioGuard40: "Diệt vi sinh không oxy hóa, hiệu cao trong việc kiểm soát màng sinh học.",
  descCorroGuard: "Hóa chất ức chế ăn mòn và cáu cặn chuyên dụng cho hệ thống Chiller kín.",
  descBioGuard40Chiller: "Diệt vi sinh không oxy hóa, hiệu cao trong việc kiểm soát màng sinh học.",

  // Intro Defaults (will be overwritten by translation-based init if needed)
  introAboutTitle: "Culligan - Đối tác Chuyên gia Xử lý Nước Toàn cầu",
  introAboutText: "Với hơn 100 năm di sản và kinh nghiệm, Culligan là đơn vị dẫn đầu thế giới trong việc cung cấp các giải pháp xử lý nước toàn diện. Chúng tôi kết hợp giữa thiết bị công nghệ cao và các giải pháp hóa chất chuyên sâu để tối ưu hóa hiệu suất và tuổi thọ hệ thống của khách hàng.",
  introCoolingFocusTitle: "GIẢI PHÁP KIỂM SOÁT NƯỚC GIẢI NHIỆT",
  introCoolingFocusText: "Chương trình xử lý hóa chất của Culligan được thiết kế để giải quyết triệt để 4 thách thức cốt lõi trong hệ thống tháp giải nhiệt và chiller:",
  introScaleTitle: "Kiểm soát Cáu cặn",
  introScaleDesc: "Ngăn ngừa sự tích tụ khoáng chất trên các bề mặt trao đổi nhiệt, duy trì hiệu suất truyền nhiệt tối đa và tiết kiệm năng lượng.",
  introCorrosionTitle: "Kiểm soát Ăn mòn",
  introCorrosionDesc: "Bảo vệ các bề mặt kim loại khỏi sự xâm thực, kéo dài đáng kể vòng đời thiết bị và giảm thiểu chi phí bảo trì phát sinh.",
  introFoulingTitle: "Ngăn ngừa Lắng đọng",
  introFoulingDesc: "Sử dụng các chất phân tán tiên tiến để giữ các chất lơ lửng không bị lắng đọng, đảm bảo hệ thống đường ống luôn sạch và thông suốt.",
  introMicrobioTitle: "Kiểm soát Vi sinh vật",
  introMicrobioDesc: "Triển khai các chương trình diệt khuẩn chính xác để ngăn ngừa màng sinh học và sự phát triển của vi khuẩn có hại.",
};

  // --- Calculations ---
const calculateMetrics = (data: ReportData) => {
  const deltaT = Math.abs(data.tempIn - data.tempOut);
  
  // Use input COC
  const coc = data.coc;

  // Evaporation (E) = Circulation Flow * Operating Load/100 * ΔT / 580
  const evaporation = data.circulationFlow * (data.manualLoadPercentage / 100) * deltaT / 580;
  
  // Drift (D) = Circulation Flow * 0.05/100 * Operating Load/100
  const drift = data.circulationFlow * (0.05 / 100) * (data.manualLoadPercentage / 100);
  
  // Blowdown (B) = E / (COC - 1)
  const blowdown = coc > 1 ? (evaporation / (coc - 1)) : 0;
  
  // Makeup (M) = E + B + D
  const makeup = evaporation + blowdown + drift;
  
  // Efficiency (kW/RT) = Power / Capacity
  const efficiency = (data.capacityRT > 0) ? (data.powerInput / data.capacityRT) : 0;
  
  // System Load % (User input)
  const loadPercentage = data.manualLoadPercentage;

  // --- LSI Calculation ---
  // Only calculate if required fields are present
  const hasLsiInputs = data.measuredPh > 0 && data.measuredConductivity > 0 && data.measuredHardness > 0 && data.measuredMAlk > 0;
  
  let calculatedLsi = null;
  if (hasLsiInputs) {
    // A = (log10(Conductivity * 0.65) - 1) / 10
    const tds = data.measuredConductivity * 0.65;
    const A = (Math.log10(Math.max(1, tds)) - 1) / 10;
    // B = -13.12 * log10(Temp. Cooling Water + 273.15) + 34.55
    const B = -13.12 * Math.log10(data.tempOut + 273.15) + 34.55;
    // C = log10(Total hardness * 0.8) - 0.4
    const C = Math.log10(Math.max(1, data.measuredHardness * 0.8)) - 0.4;
    // D = log10(Alk)
    const D = Math.log10(Math.max(1, data.measuredMAlk));
    const phs = (9.3 + A + B) - (C + D);
    calculatedLsi = data.measuredPh - phs;
  }

  // --- Chemical Calculations ---
  const currentChemicals = data.systemType === 'CHILLER' ? data.chillerChemicals : data.towerChemicals;
  const updatedChemicals = currentChemicals.map(chem => {
    let kgDay = 0;
    let kgMonth = 0;
    let kgYear = 0;
    let kgInitial = 0;

    if (data.systemType === 'CHILLER') {
      if (chem.type === "corrosionScale") {
        kgInitial = (chem.dosage * data.systemVolume) / 1000;
        kgMonth = (chem.dosage * data.systemVolume * data.systemLeakage / 100) / 1000;
        kgDay = 0;
        kgYear = kgMonth * 12;
      } else if (chem.type === "microbiological") {
        kgMonth = (data.systemVolume * chem.dosage * 2) / 1000;
        kgDay = kgMonth / 30;
        kgYear = kgMonth * 12;
      }
    } else {
      // COOLING TOWER
      if (chem.type === "scaleCorrosion") {
        kgDay = (chem.dosage * blowdown * data.operatingHours) / 1000;
        kgMonth = kgDay * data.operatingDaysPerMonth;
        kgYear = kgMonth * 12;
      } else if (chem.type === "dispersant") {
        // Formula: kg/day = (Blowdown * Dosage * Operating Hour) / 1000
        kgDay = (chem.dosage * blowdown * data.operatingHours) / 1000;
        kgMonth = kgDay * data.operatingDaysPerMonth;
        kgYear = kgMonth * 12;
      } else if (chem.type === "oxidizing") {
        if (chem.name.toUpperCase().includes("NAOCL")) {
          kgDay = ((chem.dosage/10) * 1.1 * data.circulationFlow * (data.manualLoadPercentage / 100) * data.operatingHours) / 1000;
          kgMonth = kgDay * data.operatingDaysPerMonth;
          kgYear = kgMonth * 12;
        } else {
          kgMonth = (chem.dosage * data.systemVolume * 8) / 1000;
          kgDay = kgMonth / data.operatingDaysPerMonth;
          kgYear = kgMonth * 12;
        }
      } else if (chem.type === "nonOxidizing") {
        kgMonth = (chem.dosage * data.systemVolume * 2) / 1000;
        kgDay = 0; 
        kgYear = kgMonth * 12;
      } else {
        kgDay = chem.kgDay;
        kgMonth = kgDay * data.operatingDaysPerMonth;
        kgYear = kgMonth * 12;
      }
    }

    return { 
      ...chem, 
      kgDay: Number(kgDay) || 0, 
      kgMonth: Number(kgMonth) || 0, 
      kgYear: Number(kgYear) || 0, 
      kgInitial: Number(kgInitial) || 0 
    };
  });

  return {
    deltaT: Number(deltaT) || 0,
    evaporation: Number(evaporation) || 0,
    drift: Number(drift) || 0,
    blowdown: Number(blowdown) || 0,
    makeup: Number(makeup) || 0,
    efficiency: Number(efficiency) || 0,
    loadPercentage: Number(loadPercentage) || 0,
    calculatedCoc: Number(coc) || 0,
    calculatedLsi: calculatedLsi,
    updatedChemicals
  };
};

// --- Components ---

const InputField = ({ label, value, onChange, type = "text", suffix = "" }: any) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const displayValue = isFocused || type !== "number" 
    ? (value ?? "") 
    : (value !== null && value !== undefined && value !== "" && !isNaN(Number(value)) 
        ? new Intl.NumberFormat('en-US').format(Number(value)) 
        : (value ?? ""));

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input 
          type={isFocused ? type : "text"}
          value={displayValue}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => {
            if (type === "number") {
              const val = e.target.value;
              if (val === "") {
                onChange(null);
              } else {
                const parsed = parseFloat(val);
                onChange(isNaN(parsed) ? null : parsed);
              }
            } else {
              onChange(e.target.value);
            }
          }}
          className="w-full bg-slate-50 border-0 border-b border-slate-200 px-2 py-1.5 text-sm font-medium focus:ring-0 focus:border-indigo-500 transition-colors"
        />
        {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-700">{suffix}</span>}
      </div>
    </div>
  );
};

const TextAreaField = ({ label, value, onChange }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">{label}</label>
    <textarea 
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-slate-50 border-0 border-b border-slate-200 px-2 py-1.5 text-sm font-medium focus:ring-0 focus:border-indigo-500 transition-colors min-h-[80px] resize-none"
    />
  </div>
);

import { translateReportData } from './services/translationService';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [exportLogs, setExportLogs] = useState<any[]>([]);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [pendingExportAction, setPendingExportAction] = useState<(() => void) | null>(null);

  const [data, setData] = useState<ReportData>(() => {
    const saved = localStorage.getItem('culligan_current_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate towerChemicals if needed
      if (parsed.towerChemicals) {
        const migrated = [...parsed.towerChemicals];
        // Ensure 4 items
        while (migrated.length < 4) {
          migrated.push(INITIAL_DATA.towerChemicals[migrated.length]);
        }
        // Fix types
        migrated.forEach(chem => {
          if (chem.name.includes("22C55")) chem.type = "dispersant";
          else if (chem.name.toUpperCase().includes("NAOCL") || chem.name.includes("41H01")) chem.type = "oxidizing";
          else if (chem.name.includes("Total Guard")) chem.type = "scaleCorrosion";
          else if (chem.name.includes("40H16")) chem.type = "nonOxidizing";
        });
        parsed.towerChemicals = migrated;
      }
      return { ...INITIAL_DATA, ...parsed };
    }
    
    const savedLang = localStorage.getItem('app_language');
    const initialLang = (savedLang === 'VI' || savedLang === 'EN') ? savedLang : 'VI';
    const t = TRANSLATIONS[initialLang];
    
    return {
      ...INITIAL_DATA,
      summaryTitle: t.defaults.summaryTitle,
      chillerOperatingNotes: t.defaults.chillerNotes,
      towerOperatingNotes: t.defaults.towerNotes,
      chillerRecommendations: t.defaults.chillerRecs,
      towerRecommendations: t.defaults.towerRecs,
      introAboutTitle: t.intro.aboutTitle,
      introAboutText: t.intro.aboutText,
      introCoolingFocusTitle: t.intro.coolingFocusTitle,
      introCoolingFocusText: t.intro.coolingFocusText,
      introScaleTitle: t.intro.scale.title,
      introScaleDesc: t.intro.scale.desc,
      introCorrosionTitle: t.intro.corrosion.title,
      introCorrosionDesc: t.intro.corrosion.desc,
      introFoulingTitle: t.intro.fouling.title,
      introFoulingDesc: t.intro.fouling.desc,
      introMicrobioTitle: t.intro.microbio.title,
      introMicrobioDesc: t.intro.microbio.desc,
      descTotalGuard: t.labels.descTotalGuard,
      descBioGuard41: t.labels.descBioGuard41,
      descBioGuard40: t.labels.descBioGuard40,
      descCorroGuard: t.labels.descCorroGuard,
      descBioGuard40Chiller: t.labels.descBioGuard40Chiller,
    };
  });

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved === 'VI' || saved === 'EN') ? saved : 'VI';
  });

  const [isTranslating, setIsTranslating] = useState(false);

  const t = TRANSLATIONS[language];

  useEffect(() => {
    localStorage.setItem('culligan_current_data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);
  const [isExporting, setIsExporting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('intro');
  const [savedProposals, setSavedProposals] = useState<ReportData[]>(() => {
    const saved = localStorage.getItem('culligan_proposals');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((p: any) => ({ ...INITIAL_DATA, ...p }));
    }
    
    // Migration from old key
    const oldSaved = localStorage.getItem('chemizol_proposals');
    if (oldSaved) {
      const parsed = JSON.parse(oldSaved);
      localStorage.setItem('culligan_proposals', oldSaved);
      localStorage.removeItem('chemizol_proposals');
      return parsed.map((p: any) => ({ ...INITIAL_DATA, ...p }));
    }
    return [];
  });

  React.useEffect(() => {
    // Safety timeout for loading state
    const timeout = setTimeout(() => {
      if (isAuthLoading) {
        console.warn("Auth loading timed out");
        setIsAuthLoading(false);
      }
    }, 8000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeout);
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          const profile = await syncUserProfile(firebaseUser);
          setUserProfile(profile);
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        setAuthError(error instanceof Error ? error.message : "Authentication failed");
      } finally {
        setIsAuthLoading(false);
      }
    });
    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  React.useEffect(() => {
    if (userProfile?.role === 'admin') {
      const q = query(collection(db, 'exportLogs'), orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExportLogs(logs);
      }, (error) => {
        if (error?.message?.includes('offline') || String(error).includes('offline')) {
          console.warn("Client offline. Could not load export logs.");
          return;
        }
        handleFirestoreError(error, OperationType.LIST, 'exportLogs');
      });
      return () => unsubscribe();
    }
  }, [userProfile]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveTab('intro');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const logExport = async (emailToUse?: string) => {
    const email = emailToUse || userProfile?.email || user?.email || "guest@example.com";
    const logId = `log_${Date.now()}`;
    
    try {
      const chemicalUsage: any = {};
      if (data.systemType === 'COOLING_TOWER') {
        data.towerChemicals.forEach(chem => {
          if (chem.name) chemicalUsage[chem.name] = chem.dosage;
        });
      } else {
        data.chillerChemicals.forEach(chem => {
          if (chem.name) chemicalUsage[chem.name] = chem.dosage;
        });
      }

      await addDoc(collection(db, 'exportLogs'), {
        id: logId,
        proposalId: data.reportId,
        customerName: data.customerName,
        authorUid: user?.uid || "guest",
        authorEmail: email,
        timestamp: serverTimestamp(),
        chemicalUsage
      });
      console.log("Export logged successfully for:", email);
    } catch (error) {
      console.error("Failed to log export:", error);
    }
  };

  const checkEmailAndExport = (action: () => void) => {
    if (user || guestEmail) {
      action();
      logExport(guestEmail);
    } else {
      setPendingExportAction(() => action);
      setShowEmailPrompt(true);
    }
  };

  React.useEffect(() => {
    localStorage.setItem('culligan_proposals', JSON.stringify(savedProposals));
  }, [savedProposals]);

  const handleLanguageToggle = async () => {
    const nextLang = language === 'VI' ? 'EN' : 'VI';
    setIsTranslating(true);
    try {
      const translatedData = await translateReportData(data, nextLang);
      setData(translatedData);
      setLanguage(nextLang);
    } catch (error) {
      console.error("Translation failed:", error);
      setLanguage(nextLang);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSaveProposal = async () => {
    if (!user) {
      alert("Please login to save proposals.");
      return;
    }

    const newProposal = { 
      ...data, 
      date: new Date().toLocaleString('en-GB'),
      authorUid: user.uid,
      authorEmail: user.email,
      createdAt: serverTimestamp()
    };
    
    try {
      await setDoc(doc(db, 'proposals', data.reportId), newProposal);
      
      const exists = savedProposals.findIndex(p => p.reportId === data.reportId);
      if (exists !== -1) {
        const updated = [...savedProposals];
        updated[exists] = newProposal;
        setSavedProposals(updated);
      } else {
        setSavedProposals([newProposal, ...savedProposals]);
      }
      alert(t.sidebar.saveSuccess);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `proposals/${data.reportId}`);
    }
  };

  const deleteProposal = (id: string) => {
    if (confirm(t.sidebar.deleteConfirm || 'Delete this proposal?')) {
      setSavedProposals(savedProposals.filter(p => p.reportId !== id));
      // Also delete from Firestore
      const deleteFromFirestore = async () => {
        try {
          await deleteDoc(doc(db, 'proposals', id));
        } catch (error) {
          console.error("Failed to delete from Firestore:", error);
        }
      };
      deleteFromFirestore();
    }
  };

  const duplicateProposal = async (proposal: ReportData) => {
    const newId = `${proposal.reportId}_COPY_${Math.floor(Math.random() * 1000)}`;
    const newProposal = {
      ...proposal,
      customerName: `${proposal.customerName} (Copy)`,
      reportId: newId,
      date: new Date().toLocaleDateString('en-GB')
    };
    
    // Save to Firestore immediately
    try {
      await setDoc(doc(db, 'proposals', newId), newProposal);
      setSavedProposals([newProposal, ...savedProposals]);
      alert("Project duplicated successfully!");
    } catch (error) {
      console.error("Duplication failed:", error);
      // Fallback to local only if firestore fails
      setSavedProposals([newProposal, ...savedProposals]);
    }
  };

  const createNewProject = () => {
    if (confirm("Start a new project? Any unsaved changes on current project will be lost if not saved to history.")) {
      const resetData = {
        ...INITIAL_DATA,
        reportId: `PRO-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleDateString('en-GB'),
        summaryTitle: t.defaults.summaryTitle,
        chillerOperatingNotes: t.defaults.chillerNotes,
        towerOperatingNotes: t.defaults.towerNotes,
        chillerRecommendations: t.defaults.chillerRecs,
        towerRecommendations: t.defaults.towerRecs,
        introAboutTitle: t.intro.aboutTitle,
        introAboutText: t.intro.aboutText,
        introCoolingFocusTitle: t.intro.coolingFocusTitle,
        introCoolingFocusText: t.intro.coolingFocusText,
        introScaleTitle: t.intro.scale.title,
        introScaleDesc: t.intro.scale.desc,
        introCorrosionTitle: t.intro.corrosion.title,
        introCorrosionDesc: t.intro.corrosion.desc,
        introFoulingTitle: t.intro.fouling.title,
        introFoulingDesc: t.intro.fouling.desc,
        introMicrobioTitle: t.intro.microbio.title,
        introMicrobioDesc: t.intro.microbio.desc,
        descTotalGuard: t.labels.descTotalGuard,
        descDepositGuard: t.labels.descDepositGuard,
        descBioGuard41: t.labels.descBioGuard41,
        descBioGuard40: t.labels.descBioGuard40,
        descCorroGuard: t.labels.descCorroGuard,
        descBioGuard40Chiller: t.labels.descBioGuard40Chiller,
      };
      setData(resetData);
      setActiveTab('editor');
    }
  };

  const loadProposal = (proposal: ReportData) => {
    setData({ ...INITIAL_DATA, ...proposal });
    setActiveTab('editor');
  };

  const handleReset = () => {
    if (confirm(t.sidebar.reset + '?')) {
      const resetData = {
        ...INITIAL_DATA,
        summaryTitle: t.defaults.summaryTitle,
        chillerOperatingNotes: t.defaults.chillerNotes,
        towerOperatingNotes: t.defaults.towerNotes,
        chillerRecommendations: t.defaults.chillerRecs,
        towerRecommendations: t.defaults.towerRecs,
        introAboutTitle: t.intro.aboutTitle,
        introAboutText: t.intro.aboutText,
        introCoolingFocusTitle: t.intro.coolingFocusTitle,
        introCoolingFocusText: t.intro.coolingFocusText,
        introScaleTitle: t.intro.scale.title,
        introScaleDesc: t.intro.scale.desc,
        introCorrosionTitle: t.intro.corrosion.title,
        introCorrosionDesc: t.intro.corrosion.desc,
        introFoulingTitle: t.intro.fouling.title,
        introFoulingDesc: t.intro.fouling.desc,
        introMicrobioTitle: t.intro.microbio.title,
        introMicrobioDesc: t.intro.microbio.desc,
        descTotalGuard: t.labels.descTotalGuard,
        descDepositGuard: t.labels.descDepositGuard,
        descBioGuard41: t.labels.descBioGuard41,
        descBioGuard40: t.labels.descBioGuard40,
        descCorroGuard: t.labels.descCorroGuard,
        descBioGuard40Chiller: t.labels.descBioGuard40Chiller,
        date: new Date().toLocaleDateString('en-GB'),
        consumptionCooling: INITIAL_DATA.consumptionCooling,
        consumptionChiller: INITIAL_DATA.consumptionChiller,
      };
      setData(resetData);
    }
  };

  const reportRef = useRef<HTMLDivElement>(null);
  
  const metrics = useMemo(() => calculateMetrics(data), [data]);

  const handlePrint = async () => {
    if (!reportRef.current || isExporting) return;

    checkEmailAndExport(async () => {
      setIsExporting(true);
      
      try {
        const element = reportRef.current!;
        
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
          onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.querySelector('.a4-page') as HTMLElement;
            if (clonedElement) {
              clonedElement.style.boxShadow = 'none';
              clonedElement.style.margin = '0';
              clonedElement.style.overflow = 'visible';
            }
          }
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        const ratio = pdfWidth / imgWidth;
        const canvasHeightOnPdf = imgHeight * ratio;
        
        let heightLeft = canvasHeightOnPdf;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, canvasHeightOnPdf, undefined, 'FAST');
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - canvasHeightOnPdf;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, canvasHeightOnPdf, undefined, 'FAST');
          heightLeft -= pdfHeight;
        }
        
        const fileName = `Culligan_Report_${data.customerName.replace(/\s+/g, '_') || 'Report'}_${data.reportId}.pdf`;

        pdf.setProperties({
          title: fileName,
          subject: 'Culligan Technical Report',
          author: data.engineerName,
          creator: 'Industrial Report Generator'
        });

        try {
          pdf.save(fileName);
        } catch (saveError) {
          const blob = pdf.output('blob');
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      } catch (error) {
        console.error('PDF Export failed:', error);
        alert('Có lỗi khi xuất PDF. Vui lòng thử mở ứng dụng trong tab mới hoặc sử dụng tính năng In (Ctrl+P).');
      } finally {
        setIsExporting(false);
      }
    });
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const handleSystemPrint = async () => {
    checkEmailAndExport(() => {
      window.print();
    });
  };

  const updateChemical = (index: number, field: keyof ChemicalRow, value: any) => {
    const fieldName = data.systemType === 'CHILLER' ? 'chillerChemicals' : 'towerChemicals';
    const newChems = [...data[fieldName]];
    const oldName = newChems[index].name;
    const newData = { ...data };
    
    let updatedChem = { ...newChems[index], [field]: value };
    
    // Auto-update type if name changes
    if (field === 'name') {
      if (data.systemType === 'COOLING_TOWER') {
        if (index === 0) {
          updatedChem.type = "scaleCorrosion";
          newData.coolingTotalGuardName = value;
        } else if (index === 1) {
          updatedChem.type = "dispersant";
          newData.coolingDepositGuardName = value;
        } else if (index === 2) {
          updatedChem.type = "oxidizing";
          newData.coolingBioGuardName = value;
        } else if (index === 3) {
          updatedChem.type = "nonOxidizing";
          newData.coolingBioGuard40Name = value;
        }
      } else {
        // Chiller
        if (index === 0) {
          updatedChem.type = "corrosionScale";
          newData.chillerCorroGuardName = value;
        } else if (index === 1) {
          updatedChem.type = "microbiological";
          newData.chillerBioGuardName = value;
        }
      }
    }
    
    newChems[index] = updatedChem;
    newData[fieldName] = newChems;
    
    // If name changed, update operating notes if they contain the old name
    if (field === 'name' && oldName !== value) {
      const notesKey = data.systemType === 'CHILLER' ? 'chillerOperatingNotes' : 'towerOperatingNotes';
      const oldNotes = data[notesKey];
      if (oldNotes.includes(oldName)) {
        newData[notesKey] = oldNotes.split(oldName).join(value);
      }
    }
    
    setData(newData);
  };

  const updateRecommendation = (index: number, field: keyof Recommendation, value: string) => {
    const fieldName = data.systemType === 'CHILLER' ? 'chillerRecommendations' : 'towerRecommendations';
    const newRecs = [...data[fieldName]];
    newRecs[index] = { ...newRecs[index], [field]: value };
    setData({ ...data, [fieldName]: newRecs });
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Session...</p>
        </div>
      </div>
    );
  }

  // Removed mandatory login screen

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900 overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-50 no-print">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 flex items-center justify-center rounded-lg shadow-md shadow-indigo-100">
            <Calculator className="text-white w-5 h-5" />
          </div>
          <span className="font-black text-sm tracking-tight">Chemizol Report</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* --- Sidebar / Editor --- */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside 
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed md:sticky top-0 left-0 w-full md:w-85 bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-64px)] md:h-screen z-40 no-print shadow-2xl md:shadow-none overflow-hidden"
          >
            <div className="hidden md:flex p-6 border-b border-slate-100 items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 flex items-center justify-center rounded-xl shadow-lg shadow-indigo-200">
                  <Calculator className="text-white w-6 h-6" />
                </div>
                <div>
                  <h1 className="font-black text-base tracking-tight leading-none">{t.sidebar.title}</h1>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Professional Edition</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-slate-100/80 p-1 rounded-xl">
              <div className={`grid ${userProfile?.role === 'admin' ? 'grid-cols-6' : 'grid-cols-5'} gap-1`}>
                <TabButton active={activeTab === 'intro'} onClick={() => setActiveTab('intro')} icon={<Info className="w-4 h-4" />} label={t.sidebar.intro} />
                <TabButton active={activeTab === 'editor'} onClick={() => setActiveTab('editor')} icon={<Edit className="w-4 h-4" />} label={t.sidebar.editor} />
                <TabButton active={activeTab === 'consumption'} onClick={() => setActiveTab('consumption')} icon={<Zap className="w-4 h-4" />} label={t.sidebar.consumption} />
                <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History className="w-4 h-4" />} label={t.sidebar.history} />
                <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings className="w-4 h-4" />} label="STG" />
                {userProfile?.role === 'admin' && (
                  <TabButton active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon={<ShieldCheck className="w-4 h-4" />} label="ADM" />
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
              {/* User Profile */}
              {user ? (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-white shadow-sm" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-600 flex items-center justify-center rounded-full">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-black text-slate-800 truncate">{user.displayName || user.email}</p>
                      <p className="text-[8px] font-bold text-indigo-600 uppercase tracking-widest">{userProfile?.role || 'User'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-all active:scale-95"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="w-full p-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                >
                  <LogIn className="w-4 h-4" />
                  Sign in with Google
                </button>
              )}
              {/* Quick Actions in Sidebar */}
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Actions</span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={handleLanguageToggle}
                    disabled={isTranslating}
                    className={`px-2 py-1 text-[10px] font-black border border-slate-200 rounded-lg hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-1.5 ${isTranslating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
                    {language === 'VI' ? 'EN' : 'VI'}
                  </button>
                  <button 
                    onClick={handleSaveProposal}
                    className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-all active:scale-95 border border-transparent hover:border-emerald-100"
                    title={t.sidebar.saveProposal}
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleReset}
                    className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg transition-all active:scale-95 border border-transparent hover:border-amber-100"
                    title={t.sidebar.reset}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {activeTab === 'intro' ? (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <FileText className="w-4 h-4" />
                    <h2 className="text-xs font-black uppercase tracking-widest">{t.sections.introContent}</h2>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg space-y-4">
                    <InputField label={t.labels.title} value={data.introAboutTitle} onChange={(v: string) => setData({...data, introAboutTitle: v})} />
                    <TextAreaField label={t.labels.content} value={data.introAboutText} onChange={(v: string) => setData({...data, introAboutText: v})} />
                    
                    <div className="pt-2 border-t border-slate-200">
                      <InputField label={t.labels.title} value={data.introCoolingFocusTitle} onChange={(v: string) => setData({...data, introCoolingFocusTitle: v})} />
                      <TextAreaField label={t.labels.content} value={data.introCoolingFocusText} onChange={(v: string) => setData({...data, introCoolingFocusText: v})} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 pt-2 border-t border-slate-200">
                      <div className="space-y-2">
                        <InputField label={`${t.intro.scale.title} (Title)`} value={data.introScaleTitle} onChange={(v: string) => setData({...data, introScaleTitle: v})} />
                        <TextAreaField label={`${t.intro.scale.title} (Desc)`} value={data.introScaleDesc} onChange={(v: string) => setData({...data, introScaleDesc: v})} />
                      </div>
                      <div className="space-y-2">
                        <InputField label={`${t.intro.corrosion.title} (Title)`} value={data.introCorrosionTitle} onChange={(v: string) => setData({...data, introCorrosionTitle: v})} />
                        <TextAreaField label={`${t.intro.corrosion.title} (Desc)`} value={data.introCorrosionDesc} onChange={(v: string) => setData({...data, introCorrosionDesc: v})} />
                      </div>
                      <div className="space-y-2">
                        <InputField label={`${t.intro.fouling.title} (Title)`} value={data.introFoulingTitle} onChange={(v: string) => setData({...data, introFoulingTitle: v})} />
                        <TextAreaField label={`${t.intro.fouling.title} (Desc)`} value={data.introFoulingDesc} onChange={(v: string) => setData({...data, introFoulingDesc: v})} />
                      </div>
                      <div className="space-y-2">
                        <InputField label={`${t.intro.microbio.title} (Title)`} value={data.introMicrobioTitle} onChange={(v: string) => setData({...data, introMicrobioTitle: v})} />
                        <TextAreaField label={`${t.intro.microbio.title} (Desc)`} value={data.introMicrobioDesc} onChange={(v: string) => setData({...data, introMicrobioDesc: v})} />
                      </div>
                    </div>
                  </div>
                </section>
              ) : activeTab === 'editor' ? (
                <>
                  {/* System Type Toggle */}
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                      onClick={() => setData({ ...data, systemType: 'CHILLER' })}
                      className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${data.systemType === 'CHILLER' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-800'}`}
                    >
                      {t.sidebar.chiller}
                    </button>
                    <button 
                      onClick={() => setData({ ...data, systemType: 'COOLING_TOWER' })}
                      className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${data.systemType === 'COOLING_TOWER' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-800'}`}
                    >
                      {t.sidebar.cooling}
                    </button>
                  </div>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <FileText className="w-4 h-4" />
                  <h2 className="text-xs font-black uppercase tracking-widest">{t.sections.general}</h2>
                </div>
                <div className="grid gap-4">
                  <InputField label={t.labels.customer} value={data.customerName} onChange={(v: any) => setData({...data, customerName: v})} />
                  <InputField label={t.labels.project} value={data.projectName} onChange={(v: any) => setData({...data, projectName: v})} />
                  <InputField label={t.labels.reportId} value={data.reportId} onChange={(v: any) => setData({...data, reportId: v})} />
                  <InputField label={t.labels.date} value={data.date} onChange={(v: any) => setData({...data, date: v})} />
                  <InputField label={t.labels.madeBy} value={data.engineerName} onChange={(v: any) => setData({...data, engineerName: v})} />
                  <InputField label={t.labels.pageNumber} value={data.pageNumber} onChange={(v: any) => setData({...data, pageNumber: v})} />
                  <InputField label={t.labels.summaryTitle} value={data.summaryTitle} onChange={(v: any) => setData({...data, summaryTitle: v})} />
                  <InputField label={t.labels.summaryValue} value={data.summaryValue} onChange={(v: any) => setData({...data, summaryValue: v})} />
                  <InputField label={t.labels.summaryUnit} value={data.summaryUnit} onChange={(v: any) => setData({...data, summaryUnit: v})} />
                  <InputField label="Table Header (Result)" value={data.samplingTimeHeader} onChange={(v: any) => setData({...data, samplingTimeHeader: v})} />
                  <InputField label="Sampling Note" value={data.samplingNote} onChange={(v: any) => setData({...data, samplingNote: v})} />
                  <InputField label={data.systemType === 'CHILLER' ? t.labels.makeupTypeChiller : t.labels.makeupType} value={data.makeupType} onChange={(v: any) => setData({...data, makeupType: v})} />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Settings2 className="w-4 h-4" />
                  <h2 className="text-xs font-black uppercase tracking-widest">{t.sections.specs}</h2>
                </div>
                <div className="grid gap-4">
                  <InputField label={t.labels.equipment} value={data.equipmentName} onChange={(v: any) => setData({...data, equipmentName: v})} />
                  <InputField label={t.labels.material} value={data.material} onChange={(v: any) => setData({...data, material: v})} />
                  <InputField label={t.labels.volume} type="number" suffix={t.units.m3} value={data.systemVolume} onChange={(v: any) => setData({...data, systemVolume: v})} />
                  <InputField label={t.labels.capacity} type="number" suffix={t.units.rt} value={data.capacityRT} onChange={(v: any) => setData({...data, capacityRT: v})} />
                  <InputField label={t.labels.flow} type="number" suffix={t.units.m3h} value={data.circulationFlow} onChange={(v: any) => setData({...data, circulationFlow: v})} />
                  <InputField label={t.labels.load} type="number" suffix={t.units.percent} value={data.manualLoadPercentage} onChange={(v: any) => setData({...data, manualLoadPercentage: v})} />
                  {data.systemType === 'COOLING_TOWER' && (
                    <InputField label={t.labels.coc} type="number" value={data.coc} onChange={(v: any) => setData({...data, coc: v})} />
                  )}
                  <div className="grid grid-cols-2 gap-2">
                  <InputField label={t.labels.hours} type="number" suffix={t.units.hoursPerDay} value={data.operatingHours} onChange={(v: any) => setData({...data, operatingHours: v})} />
                  <InputField label={t.labels.operatingDays} type="number" suffix={t.units.daysPerMonth} value={data.operatingDaysPerMonth} onChange={(v: any) => setData({...data, operatingDaysPerMonth: v})} />
                </div>
                  <InputField label={data.systemType === 'CHILLER' ? t.chiller.return : t.labels.tempIn} type="number" suffix={t.units.celsius} value={data.tempIn} onChange={(v: any) => setData({...data, tempIn: v})} />
                  <InputField label={data.systemType === 'CHILLER' ? t.chiller.supply : t.labels.tempOut} type="number" suffix={t.units.celsius} value={data.tempOut} onChange={(v: any) => setData({...data, tempOut: v})} />
                  {data.systemType === 'CHILLER' && (
                    <>
                      <InputField label={t.labels.leakage} type="number" suffix={t.units.percentPerMonth} value={data.systemLeakage} onChange={(v: any) => setData({...data, systemLeakage: v})} />
                      <InputField label={t.labels.makeupVol} value={data.chillerMakeupVolume} onChange={(v: any) => setData({...data, chillerMakeupVolume: v})} />
                    </>
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Droplets className="w-4 h-4" />
                  <h2 className="text-xs font-black uppercase tracking-widest">{t.sections.chemistry}</h2>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                      <h3 className="text-[10px] font-black uppercase text-indigo-900 tracking-widest">SAMPLING DATE (MEASURED)</h3>
                      <span className="text-[8px] font-bold text-slate-400 uppercase">Input Values</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <InputField label={t.labels.phLevel} type="number" value={data.measuredPh} onChange={(v: any) => setData({...data, measuredPh: v})} />
                      {data.systemType === 'COOLING_TOWER' && (
                        <InputField label={t.labels.turbidity} type="number" value={data.measuredTurbidityTower} onChange={(v: any) => setData({...data, measuredTurbidityTower: v})} />
                      )}
                      <InputField label={t.labels.conductivity} type="number" value={data.measuredConductivity} onChange={(v: any) => setData({...data, measuredConductivity: v})} />
                      {data.systemType === 'COOLING_TOWER' ? (
                        <>
                          <InputField label={t.labels.hardness} type="number" value={data.measuredHardness} onChange={(v: any) => setData({...data, measuredHardness: v})} />
                          <InputField label={t.labels.silica} type="number" value={data.measuredSilica} onChange={(v: any) => setData({...data, measuredSilica: v})} />
                          <InputField label={t.labels.lsiIndex} type="number" value={data.measuredLsi} onChange={(v: any) => setData({...data, measuredLsi: v})} />
                          <InputField label={t.labels.phosphate} type="number" value={data.measuredPhosphate} onChange={(v: any) => setData({...data, measuredPhosphate: v})} />
                          <InputField label={t.labels.msCorrTower} type="number" value={data.measuredMildSteelCorrosionTower} onChange={(v: any) => setData({...data, measuredMildSteelCorrosionTower: v})} />
                          <InputField label={t.labels.cuCorrTower} type="number" value={data.measuredCopperCorrosionTower} onChange={(v: any) => setData({...data, measuredCopperCorrosionTower: v})} />
                          <InputField label={t.labels.freeChloride} type="number" value={data.measuredFreeChloride} onChange={(v: any) => setData({...data, measuredFreeChloride: v})} />
                          <InputField label="Bacteria" value={data.measuredBacteriaTower} onChange={(v: any) => setData({...data, measuredBacteriaTower: v})} />
                          <InputField label="COD" type="number" value={data.measuredCodTower} onChange={(v: any) => setData({...data, measuredCodTower: v})} />
                          <InputField label={t.labels.cycle} value={data.cocLimit} onChange={(v: any) => setData({...data, cocLimit: v})} />
                        </>
                      ) : (
                        <>
                          <InputField label={t.labels.sulfate} type="number" value={data.measuredSulfate} onChange={(v: any) => setData({...data, measuredSulfate: v})} />
                          <InputField label={t.labels.nitrite} type="number" value={data.measuredNitrite} onChange={(v: any) => setData({...data, measuredNitrite: v})} />
                          <InputField label={t.labels.cuCorr} type="number" value={data.measuredCopperCorrosion} onChange={(v: any) => setData({...data, measuredCopperCorrosion: v})} />
                          <InputField label={t.labels.msCorr} type="number" value={data.measuredMildSteelCorrosion} onChange={(v: any) => setData({...data, measuredMildSteelCorrosion: v})} />
                          <InputField label={t.labels.copper} type="number" value={data.measuredCopper} onChange={(v: any) => setData({...data, measuredCopper: v})} />
                          <InputField label={t.labels.bacteria} value={data.measuredBacteria} onChange={(v: any) => setData({...data, measuredBacteria: v})} />
                        </>
                      )}
                      <InputField label={t.labels.alkalinity} type="number" value={data.measuredMAlk} onChange={(v: any) => setData({...data, measuredMAlk: v})} />
                      <InputField label={t.labels.chlorides} type="number" value={data.measuredChlorides} onChange={(v: any) => setData({...data, measuredChlorides: v})} />
                      <InputField label={t.labels.iron} type="number" value={data.measuredIron} onChange={(v: any) => setData({...data, measuredIron: v})} />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Settings2 className="w-4 h-4" />
                  <h2 className="text-xs font-black uppercase tracking-widest">Water Quality Standards</h2>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-3">
                    {data.systemType === 'COOLING_TOWER' ? (
                      Object.entries(data.towerStandards).map(([key, val]) => (
                        <InputField 
                          key={key} 
                          label={key.toUpperCase()} 
                          value={val} 
                          onChange={(v: any) => setData({
                            ...data, 
                            towerStandards: { ...data.towerStandards, [key]: v }
                          })} 
                        />
                      ))
                    ) : (
                      Object.entries(data.chillerStandards).map(([key, val]) => (
                        <InputField 
                          key={key} 
                          label={key.toUpperCase()} 
                          value={val} 
                          onChange={(v: any) => setData({
                            ...data, 
                            chillerStandards: { ...data.chillerStandards, [key]: v }
                          })} 
                        />
                      ))
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Droplets className="w-4 h-4 opacity-50" />
                  <h2 className="text-xs font-black uppercase tracking-widest opacity-50">{t.sections.makeup}</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <InputField label={t.labels.noteContent} value={data.makeupType} onChange={(v: any) => setData({...data, makeupType: v})} />
                  </div>
                  <InputField label={t.labels.phLevel} type="number" value={data.makeupPh} onChange={(v: any) => setData({...data, makeupPh: v})} />
                  <InputField label={t.labels.conductivity} type="number" value={data.makeupEc} onChange={(v: any) => setData({...data, makeupEc: v})} />
                  <InputField label={t.labels.hardness} type="number" value={data.makeupHardness} onChange={(v: any) => setData({...data, makeupHardness: v})} />
                  {data.systemType === 'COOLING_TOWER' && (
                    <InputField label={t.labels.silica} type="number" value={data.makeupSilica} onChange={(v: any) => setData({...data, makeupSilica: v})} />
                  )}
                  <InputField label={t.labels.chlorides} type="number" value={data.makeupChloride} onChange={(v: any) => setData({...data, makeupChloride: v})} />
                  {data.systemType === 'CHILLER' && (
                    <InputField label={t.labels.sulfate} type="number" value={data.makeupSulfate} onChange={(v: any) => setData({...data, makeupSulfate: v})} />
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Zap className="w-4 h-4" />
                  <h2 className="text-xs font-black uppercase tracking-widest">{t.sections.chemicals}</h2>
                </div>
                <div className="space-y-3">
                  {(data.systemType === 'CHILLER' ? data.chillerChemicals : data.towerChemicals).map((chem, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg space-y-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">{t.report.chemical}</label>
                        {data.systemType === 'COOLING_TOWER' ? (
                          i === 1 ? (
                            <input 
                              type="text"
                              value={chem.name}
                              onChange={(e) => updateChemical(i, 'name', e.target.value)}
                              className="w-full bg-white border border-slate-200 px-2 py-1.5 text-sm font-medium focus:ring-0 focus:border-indigo-500 transition-colors rounded-md"
                            />
                          ) : (
                            <select 
                              value={chem.name}
                              onChange={(e) => updateChemical(i, 'name', e.target.value)}
                              className="w-full bg-white border border-slate-200 px-2 py-1.5 text-sm font-medium focus:ring-0 focus:border-indigo-500 transition-colors rounded-md"
                            >
                              {i === 0 ? (
                                <>
                                  <option value="Culligan Total Guard 20C04">Culligan Total Guard 20C04</option>
                                  <option value="Culligan Total Guard 20C23">Culligan Total Guard 20C23</option>
                                </>
                              ) : i === 2 ? (
                                <>
                                  <option value="Culligan Bio Guard 41H01">Culligan Bio Guard 41H01</option>
                                  <option value="NaOCl 10%">NaOCl 10%</option>
                                </>
                              ) : (
                                <>
                                  <option value="Culligan Bio Guard 40H16">Culligan Bio Guard 40H16</option>
                                </>
                              )}
                            </select>
                          )
                        ) : (
                          <input 
                            type="text"
                            value={chem.name}
                            onChange={(e) => updateChemical(i, 'name', e.target.value)}
                            className="w-full bg-white border border-slate-200 px-2 py-1.5 text-sm font-medium focus:ring-0 focus:border-indigo-500 transition-colors rounded-md"
                          />
                        )}
                      </div>
                      <InputField label={t.labels.dosage} type="number" value={chem.dosage} onChange={(v: any) => updateChemical(i, 'dosage', v)} />
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Info className="w-4 h-4" />
                  <h2 className="text-xs font-black uppercase tracking-widest">{t.sections.recommendations}</h2>
                </div>
                <div className="space-y-4">
                  {(data.systemType === 'CHILLER' ? data.chillerRecommendations : data.towerRecommendations).map((rec, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg space-y-2">
                      <InputField label={`${t.labels.title} ${i+1}`} value={rec.title} onChange={(v: any) => updateRecommendation(i, 'title', v)} />
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">{t.labels.content} {i+1}</label>
                        <textarea 
                          value={rec.desc}
                          onChange={(e) => updateRecommendation(i, 'desc', e.target.value)}
                          className="w-full bg-white border border-slate-200 p-2 text-sm font-medium focus:ring-0 focus:border-indigo-500 transition-colors rounded-md min-h-[60px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <FileText className="w-4 h-4" />
                  <h2 className="text-xs font-black uppercase tracking-widest">{t.sections.notes}</h2>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <TextAreaField 
                    label={t.labels.noteContent} 
                    value={data.systemType === 'CHILLER' ? data.chillerOperatingNotes : data.towerOperatingNotes} 
                    onChange={(v: string) => setData({
                      ...data, 
                      [data.systemType === 'CHILLER' ? 'chillerOperatingNotes' : 'towerOperatingNotes']: v
                    })} 
                  />
                </div>
              </section>
            </>
          ) : activeTab === 'consumption' ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-indigo-600 mb-6">
                <Calculator className="w-5 h-5" />
                <h2 className="text-sm font-black uppercase tracking-widest">{t.sidebar.consumption}</h2>
              </div>

              <div className="space-y-10">
                {/* Chemical Descriptions Editor */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <FileText className="w-4 h-4" />
                    <h2 className="text-xs font-black uppercase tracking-widest">{t.labels.chemicalFunctions}</h2>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg space-y-4">
                    <div className="space-y-2">
                      <InputField label="Name (Total Guard)" value={data.coolingTotalGuardName} onChange={(v: string) => setData({...data, coolingTotalGuardName: v})} />
                      <TextAreaField label="Description" value={data.descTotalGuard} onChange={(v: string) => setData({...data, descTotalGuard: v})} />
                    </div>
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <InputField label="Name (Deposit Guard)" value={data.coolingDepositGuardName} onChange={(v: string) => setData({...data, coolingDepositGuardName: v})} />
                      <TextAreaField label="Description" value={data.descDepositGuard} onChange={(v: string) => setData({...data, descDepositGuard: v})} />
                    </div>
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <InputField label="Name (Bio Guard 41)" value={data.coolingBioGuardName} onChange={(v: string) => setData({...data, coolingBioGuardName: v})} />
                      <TextAreaField label="Description" value={data.descBioGuard41} onChange={(v: string) => setData({...data, descBioGuard41: v})} />
                    </div>
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <InputField label="Name (Bio Guard 40 - Cooling)" value={data.coolingBioGuard40Name} onChange={(v: string) => setData({...data, coolingBioGuard40Name: v})} />
                      <TextAreaField label="Description" value={data.descBioGuard40} onChange={(v: string) => setData({...data, descBioGuard40: v})} />
                    </div>
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <InputField label="Name (Corro Guard)" value={data.chillerCorroGuardName} onChange={(v: string) => setData({...data, chillerCorroGuardName: v})} />
                      <TextAreaField label="Description" value={data.descCorroGuard} onChange={(v: string) => setData({...data, descCorroGuard: v})} />
                    </div>
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <InputField label="Name (Bio Guard 40 - Chiller)" value={data.chillerBioGuardName} onChange={(v: string) => setData({...data, chillerBioGuardName: v})} />
                      <TextAreaField label="Description" value={data.descBioGuard40Chiller} onChange={(v: string) => setData({...data, descBioGuard40Chiller: v})} />
                    </div>
                  </div>
                </section>

                {/* Global Chemical Selection for Cooling */}
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-indigo-900 tracking-widest">Cấu hình hóa chất Cooling</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Total Guard</label>
                      <select 
                        value={data.coolingTotalGuardName}
                        onChange={(e) => setData({...data, coolingTotalGuardName: e.target.value})}
                        className="w-full bg-white border border-slate-200 px-2 py-1.5 text-xs font-bold text-indigo-900 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none"
                      >
                        <option value="Culligan Total Guard 20C04">Culligan Total Guard 20C04</option>
                        <option value="Culligan Total Guard 20C23">Culligan Total Guard 20C23</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Bio Guard</label>
                      <select 
                        value={data.coolingBioGuardName}
                        onChange={(e) => setData({...data, coolingBioGuardName: e.target.value})}
                        className="w-full bg-white border border-slate-200 px-2 py-1.5 text-xs font-bold text-indigo-900 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none"
                      >
                        <option value="Culligan Bio Guard 41H01">Culligan Bio Guard 41H01</option>
                        <option value="NaOCl 10%">NaOCl 10%</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Cooling Water Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                    <h3 className="text-xs font-black uppercase text-indigo-900 tracking-widest">Cooling Water Systems</h3>
                    <button 
                      onClick={() => {
                        const newItem: ConsumptionSystem = {
                          name: `Tower ${data.consumptionCooling.length + 1}`,
                          quantity: 1,
                          operatingLoad: 80,
                          runningQuantity: 1,
                          totalGuard: 0,
                          depositGuard: 0,
                          bioGuard41H01: 0,
                          bioGuard40H16: 0,
                          corroGuard33L01: 0
                        };
                        setData({ ...data, consumptionCooling: [...data.consumptionCooling, newItem] });
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Thêm hệ thống
                    </button>
                  </div>
                  <div className="space-y-4">
                    {data.consumptionCooling.map((item, idx) => (
                      <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm relative group">
                        <button 
                          onClick={() => {
                            const newList = data.consumptionCooling.filter((_, i) => i !== idx);
                            setData({ ...data, consumptionCooling: newList });
                          }}
                          className="absolute -right-2 -top-2 p-1 bg-white border border-slate-200 text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="col-span-2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{t.labels.system}</label>
                            <input 
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                const newList = [...data.consumptionCooling];
                                newList[idx] = { ...newList[idx], name: e.target.value };
                                setData({ ...data, consumptionCooling: newList });
                              }}
                              className="w-full text-xs font-bold border-b border-slate-100 focus:border-indigo-500 outline-none py-1"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{t.labels.quantity}</label>
                            <input 
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const newList = [...data.consumptionCooling];
                                newList[idx] = { ...newList[idx], quantity: parseFloat(e.target.value) || 0 };
                                setData({ ...data, consumptionCooling: newList });
                              }}
                              className="w-full text-xs border-b border-slate-100 focus:border-indigo-500 outline-none py-1"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{t.labels.runningQty}</label>
                            <input 
                              type="number"
                              value={item.runningQuantity}
                              onChange={(e) => {
                                const newList = [...data.consumptionCooling];
                                newList[idx] = { ...newList[idx], runningQuantity: parseFloat(e.target.value) || 0 };
                                setData({ ...data, consumptionCooling: newList });
                              }}
                              className="w-full text-xs border-b border-slate-100 focus:border-indigo-500 outline-none py-1"
                            />
                          </div>
                        </div>
                        
                          <div className="space-y-2 border-t border-slate-50 pt-3">
                            <p className="text-[8px] font-black text-indigo-900 uppercase tracking-widest">Hóa chất tiêu thụ (kg/tháng)</p>
                            <div className="grid grid-cols-1 gap-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-600">{data.coolingTotalGuardName}</span>
                                <input 
                                  type="number"
                                  value={item.totalGuard}
                                  onChange={(e) => {
                                    const newList = [...data.consumptionCooling];
                                    newList[idx] = { ...newList[idx], totalGuard: parseFloat(e.target.value) || 0 };
                                    setData({ ...data, consumptionCooling: newList });
                                  }}
                                  className="w-20 text-right text-xs font-bold text-indigo-600 border-b border-slate-100 focus:border-indigo-500 outline-none"
                                />
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-600">{data.coolingDepositGuardName}</span>
                                <input 
                                  type="number"
                                  value={item.depositGuard}
                                  onChange={(e) => {
                                    const newList = [...data.consumptionCooling];
                                    newList[idx] = { ...newList[idx], depositGuard: parseFloat(e.target.value) || 0 };
                                    setData({ ...data, consumptionCooling: newList });
                                  }}
                                  className="w-20 text-right text-xs font-bold text-indigo-600 border-b border-slate-100 focus:border-indigo-500 outline-none"
                                />
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-600">{data.coolingBioGuardName}</span>
                                <input 
                                  type="number"
                                  value={item.bioGuard41H01}
                                  onChange={(e) => {
                                    const newList = [...data.consumptionCooling];
                                    newList[idx] = { ...newList[idx], bioGuard41H01: parseFloat(e.target.value) || 0 };
                                    setData({ ...data, consumptionCooling: newList });
                                  }}
                                  className="w-20 text-right text-xs font-bold text-indigo-600 border-b border-slate-100 focus:border-indigo-500 outline-none"
                                />
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-600">{data.coolingBioGuard40Name}</span>
                                <input 
                                  type="number"
                                  value={item.bioGuard40H16}
                                  onChange={(e) => {
                                    const newList = [...data.consumptionCooling];
                                    newList[idx] = { ...newList[idx], bioGuard40H16: parseFloat(e.target.value) || 0 };
                                    setData({ ...data, consumptionCooling: newList });
                                  }}
                                  className="w-20 text-right text-xs font-bold text-indigo-600 border-b border-slate-100 focus:border-indigo-500 outline-none"
                                />
                              </div>
                            </div>
                          </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chiller Water Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                    <h3 className="text-xs font-black uppercase text-indigo-900 tracking-widest">Chiller Water Systems</h3>
                    <button 
                      onClick={() => {
                        const newItem: ConsumptionSystem = {
                          name: `Chiller ${data.consumptionChiller.length + 1}`,
                          quantity: 1,
                          operatingLoad: 80,
                          runningQuantity: 1,
                          totalGuard: 0,
                          depositGuard: 0,
                          bioGuard41H01: 0,
                          bioGuard40H16: 0,
                          corroGuard33L01: 0
                        };
                        setData({ ...data, consumptionChiller: [...data.consumptionChiller, newItem] });
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Thêm hệ thống
                    </button>
                  </div>
                  <div className="space-y-4">
                    {data.consumptionChiller.map((item, idx) => (
                      <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm relative group">
                        <button 
                          onClick={() => {
                            const newList = data.consumptionChiller.filter((_, i) => i !== idx);
                            setData({ ...data, consumptionChiller: newList });
                          }}
                          className="absolute -right-2 -top-2 p-1 bg-white border border-slate-200 text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="col-span-2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{t.labels.system}</label>
                            <input 
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                const newList = [...data.consumptionChiller];
                                newList[idx] = { ...newList[idx], name: e.target.value };
                                setData({ ...data, consumptionChiller: newList });
                              }}
                              className="w-full text-xs font-bold border-b border-slate-100 focus:border-indigo-500 outline-none py-1"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{t.labels.quantity}</label>
                            <input 
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const newList = [...data.consumptionChiller];
                                newList[idx] = { ...newList[idx], quantity: parseFloat(e.target.value) || 0 };
                                setData({ ...data, consumptionChiller: newList });
                              }}
                              className="w-full text-xs border-b border-slate-100 focus:border-indigo-500 outline-none py-1"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{t.labels.runningQty}</label>
                            <input 
                              type="number"
                              value={item.runningQuantity}
                              onChange={(e) => {
                                const newList = [...data.consumptionChiller];
                                newList[idx] = { ...newList[idx], runningQuantity: parseFloat(e.target.value) || 0 };
                                setData({ ...data, consumptionChiller: newList });
                              }}
                              className="w-full text-xs border-b border-slate-100 focus:border-indigo-500 outline-none py-1"
                            />
                          </div>
                        </div>
                        
                          <div className="space-y-2 border-t border-slate-50 pt-3">
                            <p className="text-[8px] font-black text-indigo-900 uppercase tracking-widest">Hóa chất tiêu thụ (kg/tháng)</p>
                            <div className="grid grid-cols-1 gap-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-600">{data.chillerCorroGuardName}</span>
                                <input 
                                  type="number"
                                  value={item.corroGuard33L01}
                                  onChange={(e) => {
                                    const newList = [...data.consumptionChiller];
                                    newList[idx] = { ...newList[idx], corroGuard33L01: parseFloat(e.target.value) || 0 };
                                    setData({ ...data, consumptionChiller: newList });
                                  }}
                                  className="w-20 text-right text-xs font-bold text-indigo-600 border-b border-slate-100 focus:border-indigo-500 outline-none"
                                />
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-600">{data.chillerBioGuardName}</span>
                                <input 
                                  type="number"
                                  value={item.bioGuard40H16}
                                  onChange={(e) => {
                                    const newList = [...data.consumptionChiller];
                                    newList[idx] = { ...newList[idx], bioGuard40H16: parseFloat(e.target.value) || 0 };
                                    setData({ ...data, consumptionChiller: newList });
                                  }}
                                  className="w-20 text-right text-xs font-bold text-indigo-600 border-b border-slate-100 focus:border-indigo-500 outline-none"
                                />
                              </div>
                            </div>
                          </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'history' ? (
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <History className="w-4 h-4" />
                    <h2 className="text-xs font-black uppercase tracking-widest">{t.sidebar.historyTitle}</h2>
                  </div>
                  <button 
                    onClick={createNewProject}
                    className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100/50"
                  >
                    <Plus className="w-3 h-3" />
                    New Project
                  </button>
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">Mỗi dự án được quản lý độc lập và xuất ra PDF riêng biệt.</p>
                
                {savedProposals.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-6 h-6 text-slate-700" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">{t.sidebar.noHistory}</p>
                    <p className="text-[10px] text-slate-700 mt-2">{t.sidebar.saveHint} <Save className="inline w-3 h-3" /></p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedProposals.map((proposal) => (
                      <div 
                        key={proposal.reportId}
                        className="group p-4 bg-slate-50 hover:bg-white border border-transparent hover:border-indigo-100 rounded-xl transition-all cursor-pointer relative"
                        onClick={() => loadProposal(proposal)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">
                            {proposal.reportId}
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateProposal(proposal);
                              }}
                              className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-slate-100 text-slate-500 rounded-md transition-all"
                              title="Duplicate project"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteProposal(proposal.reportId);
                              }}
                              className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-500 rounded-md transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <h3 className="text-sm font-black text-slate-800 line-clamp-1 mb-1">{proposal.customerName || t.sidebar.noCustomer}</h3>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                          <span className="flex items-center gap-1">
                            <Droplets className="w-3 h-3" />
                            {proposal.systemType === 'CHILLER' ? t.sidebar.chiller : t.sidebar.cooling}
                          </span>
                          <span>{proposal.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'settings' ? (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-indigo-600 mb-4">
                  <Settings className="w-4 h-4" />
                  <h2 className="text-xs font-black uppercase tracking-widest">Settings</h2>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Language / Ngôn ngữ</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setLanguage('VI')}
                        className={`py-3 rounded-lg font-black text-xs transition-all ${language === 'VI' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                      >
                        TIẾNG VIỆT
                      </button>
                      <button 
                        onClick={() => setLanguage('EN')}
                        className={`py-3 rounded-lg font-black text-xs transition-all ${language === 'EN' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                      >
                        ENGLISH
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <button 
                      onClick={handleReset}
                      className="w-full py-3 bg-white border border-amber-200 text-amber-600 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-amber-50 transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset All Data
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('Clear all saved proposals?')) {
                          setSavedProposals([]);
                          localStorage.removeItem('chemizol_proposals');
                        }
                      }}
                      className="w-full py-3 bg-white border border-red-200 text-red-600 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear History
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-indigo-900 rounded-xl text-white space-y-2">
                  <div className="flex items-center gap-2 opacity-60">
                    <Info className="w-3 h-3" />
                    <span className="text-[8px] font-black uppercase tracking-widest">App Info</span>
                  </div>
                  <p className="text-[10px] font-bold leading-relaxed">
                    Chemizol Report Generator v2.0.0<br/>
                    Professional Water Treatment Solutions
                  </p>
                  <p className="text-[8px] opacity-40 font-medium">© 2024 Chemizol Water Solutions</p>
                </div>
              </div>
            ) : activeTab === 'admin' && userProfile?.role === 'admin' ? (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-indigo-600 mb-4">
                  <ShieldCheck className="w-4 h-4" />
                  <h2 className="text-xs font-black uppercase tracking-widest">Admin Dashboard</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Export Activity Logs</h3>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600">
                      <Activity className="w-3 h-3" />
                      {exportLogs.length} Events
                    </div>
                  </div>

                  {exportLogs.length === 0 ? (
                    <div className="bg-slate-50 rounded-2xl p-8 text-center border border-dashed border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No activity recorded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {exportLogs.map((log) => (
                        <div key={log.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-full">
                                <Download className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-800">{log.authorEmail}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                  {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Just now'}
                                </p>
                              </div>
                            </div>
                            <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black uppercase tracking-widest">
                              Exported
                            </div>
                          </div>
                          
                          <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Customer</span>
                              <span className="text-[10px] font-black text-slate-800">{log.customerName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Report ID</span>
                              <span className="text-[10px] font-black text-indigo-600">{log.proposalId}</span>
                            </div>
                          </div>

                          {log.chemicalUsage && Object.keys(log.chemicalUsage).length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-50">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Chemical Usage Summary</p>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(log.chemicalUsage).map(([name, dosage]: [string, any]) => (
                                  <div key={name} className="flex justify-between items-center text-[9px]">
                                    <span className="text-slate-600 truncate mr-2">{name}</span>
                                    <span className="font-bold text-indigo-600">{dosage} ppm</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handleSystemPrint}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-2 flex items-center justify-center gap-1.5 transition-all active:scale-95 rounded-md text-[10px]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  PRINT
                </button>
                <button 
                  onClick={handlePrint}
                  disabled={isExporting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-2 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-indigo-200 rounded-md text-[10px] disabled:opacity-50"
                >
                  {isExporting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  EXPORT PDF
                </button>
              </div>

              <button 
                onClick={handleOpenNewTab}
                className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 flex items-center justify-center gap-2 transition-all active:scale-95 rounded-md text-[10px]"
              >
                <ExternalLink className="w-4 h-4" />
                {t.sidebar.openNewTab}
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* --- Main Content Area --- */}
      <main className="flex-1 overflow-auto p-4 md:p-8 flex flex-col items-center relative no-scrollbar print:p-0 bg-slate-100/50">
        <div className="w-full max-w-full overflow-x-auto no-scrollbar flex justify-center pb-20 md:pb-8">
          <div className="min-w-fit transform-gpu scale-[0.65] sm:scale-[0.85] md:scale-100 origin-top transition-transform duration-300">
            {isExporting && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center no-print">
            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 max-w-xs text-center">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Generating PDF...</h3>
                <p className="text-slate-500 text-sm mt-1">Please wait while we prepare your high-quality report.</p>
              </div>
            </div>
          </div>
        )}
        {!isSidebarOpen && (
          <>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="hidden md:flex fixed left-4 top-4 p-3 bg-white shadow-lg rounded-full hover:bg-slate-50 transition-colors z-30 no-print"
            >
              <Settings2 className="w-5 h-5 text-indigo-600" />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden fixed bottom-6 right-6 p-4 bg-indigo-600 text-white shadow-2xl rounded-full z-40 active:scale-90 transition-all no-print"
            >
              <Settings2 className="w-6 h-6" />
            </button>
          </>
        )}

        {/* --- A4 Paper Preview --- */}
        <div 
          ref={reportRef}
          className="a4-page bg-white shadow-2xl relative overflow-visible flex flex-col pt-[4mm] px-[10mm] pb-[8mm] text-slate-900 w-[210mm] min-h-[297mm] mx-auto"
        >
          {activeTab === 'intro' ? (
            /* --- Intro Page View --- */
            <div className="flex flex-col h-full">
              <header className="border-b-4 border-indigo-900 pb-6 mb-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <img 
                        src="https://i.ibb.co/JFd1S1yL/logo.png" 
                        alt="Chemizol Logo" 
                        className="h-12 w-auto object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-0.5 w-8 bg-indigo-600"></div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
                        {t.intro.distributor}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Chemizol Water Treatment Solutions</p>
                    <p className="text-[10px] text-slate-400 font-bold">www.chemizol.com</p>
                  </div>
                </div>
              </header>

              <div className="flex-1 space-y-12">
                {/* Hero Section */}
                <section className="relative">
                  <div className="grid grid-cols-12 gap-8 items-center">
                    <div className="col-span-7 space-y-4">
                      <h2 className="text-2xl font-black text-indigo-900 leading-tight uppercase tracking-tight">
                        {data.introAboutTitle}
                      </h2>
                      <p className="text-xs leading-relaxed text-slate-700 text-justify whitespace-pre-wrap">
                        {data.introAboutText}
                      </p>
                      <div className="pt-4 space-y-2">
                        <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest">{data.introCoolingFocusTitle}</h3>
                        <p className="text-xs leading-relaxed text-slate-600 whitespace-pre-wrap">
                          {data.introCoolingFocusText}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-5">
                      <div className="aspect-square bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center p-8 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-5">
                          <Droplets className="w-full h-full text-indigo-900" />
                        </div>
                        <div className="text-center z-10">
                          <span className="text-5xl font-black text-indigo-900 block mb-2">100+</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Years of Innovation</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Solutions Grid */}
                <section className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xs font-black text-indigo-900 uppercase tracking-[0.2em] whitespace-nowrap">
                      {t.intro.solutionsTitle}
                    </h3>
                    <div className="h-px w-full bg-slate-100"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 bg-indigo-50/30 rounded-xl border border-indigo-100/50 flex gap-4">
                      <div className="w-28 h-28 shrink-0 rounded-lg overflow-hidden border border-indigo-100">
                        <img 
                          src="https://i.ibb.co/YTY4JPHr/Tower-Fill.webp" 
                          alt="Scale control" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-wide">{data.introScaleTitle}</h4>
                        </div>
                        <p className="text-[10px] leading-tight text-slate-600 whitespace-pre-wrap">{data.introScaleDesc}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex gap-4">
                      <div className="w-28 h-28 shrink-0 rounded-lg overflow-hidden border border-slate-200">
                        <img 
                          src="https://i.ibb.co/67BV2pMK/A-nh-chu-p-Ma-n-hi-nh-2026-04-17-lu-c-13-56-10.png" 
                          alt="Corrosion control" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wide">{data.introCorrosionTitle}</h4>
                        </div>
                        <p className="text-[10px] leading-tight text-slate-600 whitespace-pre-wrap">{data.introCorrosionDesc}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex gap-4">
                      <div className="w-28 h-28 shrink-0 rounded-lg overflow-hidden border border-slate-200">
                        <img 
                          src="https://i.ibb.co/twdkKH2g/A-nh-chu-p-Ma-n-hi-nh-2026-04-17-lu-c-13-56-26.png" 
                          alt="Fouling control" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wide">{data.introFoulingTitle}</h4>
                        </div>
                        <p className="text-[10px] leading-tight text-slate-600 whitespace-pre-wrap">{data.introFoulingDesc}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-50/30 rounded-xl border border-indigo-100/50 flex gap-4">
                      <div className="w-28 h-28 shrink-0 rounded-lg overflow-hidden border border-indigo-100">
                        <img 
                          src="https://i.ibb.co/Y7sb6yrP/A-nh-chu-p-Ma-n-hi-nh-2026-04-17-lu-c-13-58-56.png" 
                          alt="Microbiological control" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-wide">{data.introMicrobioTitle}</h4>
                        </div>
                        <p className="text-[10px] leading-tight text-slate-600 whitespace-pre-wrap">{data.introMicrobioDesc}</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <footer className="mt-auto pt-8 border-t border-slate-100 flex justify-center items-center">
              </footer>

              {/* Page Number (Bottom Center) */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {t.labels.pageNumber}: {data.pageNumber}
              </div>
            </div>
          ) : activeTab === 'consumption' ? (
            /* --- Consumption Report View --- */
            <div className="flex flex-col h-full text-slate-900">
              <header className="border-b border-indigo-900 pb-1.5 mb-1.5">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <div>
                      <h1 className="text-base font-black tracking-tighter leading-none uppercase text-indigo-900">
                        {t.labels.consumptionReport}
                      </h1>
                      <p className="text-[10px] font-bold text-slate-800 uppercase tracking-[0.2em] mt-0.5">
                        {t.labels.consumptionSubtitle}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-[10px]">
                      <div><span className="font-bold text-indigo-900 uppercase">{t.labels.customer}:</span> {data.customerName}</div>
                      <div><span className="font-bold text-indigo-900 uppercase">{t.labels.date}:</span> {data.date}</div>
                      <div><span className="font-bold text-indigo-900 uppercase">{t.labels.madeBy}:</span> {data.engineerName}</div>
                      <div><span className="font-bold text-indigo-900 uppercase">{t.labels.reportId}:</span> {data.reportId}</div>
                    </div>
                  </div>
                </div>
              </header>

              {/* Page Number (Bottom Center) */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {t.labels.pageNumber}: {data.pageNumber}
              </div>

              {/* Spacer 20px (1 row size 20) */}
              <div className="h-5" />

              <section className="mb-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="h-3 w-1 bg-indigo-900"></div>
                  <h2 className="text-[11px] font-black tracking-tight text-indigo-900 uppercase">
                    {t.labels.coolingTitle}
                  </h2>
                </div>
                
                {(() => {
                  const showTotalGuard = data.consumptionCooling.some(item => (item.totalGuard || 0) > 0);
                  const showDepositGuard = data.consumptionCooling.some(item => (item.depositGuard || 0) > 0);
                  const showBioGuard41 = data.consumptionCooling.some(item => (item.bioGuard41H01 || 0) > 0);
                  const showBioGuard40 = data.consumptionCooling.some(item => (item.bioGuard40H16 || 0) > 0);

                  return (
                    <>
                      <table className="w-full text-left border-collapse border border-slate-200 mb-2">
                        <thead>
                          <tr className="bg-indigo-900 text-white">
                            <th className="p-1 text-[10px] font-black uppercase tracking-widest">{t.labels.system}</th>
                            <th className="p-1 text-[10px] font-black uppercase tracking-widest text-center">{t.labels.quantity}</th>
                            <th className="p-1 text-[10px] font-black uppercase tracking-widest text-center">{t.labels.runningQty}</th>
                            {showTotalGuard && <th className="p-1 text-[10px] font-black uppercase tracking-widest text-center">{data.coolingTotalGuardName}</th>}
                            {showDepositGuard && <th className="p-1 text-[10px] font-black uppercase tracking-widest text-center">{data.coolingDepositGuardName}</th>}
                            {showBioGuard41 && <th className="p-1 text-[10px] font-black uppercase tracking-widest text-center">{data.coolingBioGuardName}</th>}
                            {showBioGuard40 && <th className="p-1 text-[10px] font-black uppercase tracking-widest text-center">{data.coolingBioGuard40Name}</th>}
                          </tr>
                        </thead>
                        <tbody className="text-[10px]">
                          {data.consumptionCooling.map((item, i) => (
                            <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="p-1 font-bold text-indigo-900">{item.name}</td>
                              <td className="p-1 text-center">{formatNumber(item.quantity)}</td>
                              <td className="p-1 text-center">{formatNumber(item.runningQuantity)}</td>
                              {showTotalGuard && <td className="p-1 text-center font-semibold">{formatNumber(item.totalGuard, 1)}</td>}
                              {showDepositGuard && <td className="p-1 text-center font-semibold">{formatNumber(item.depositGuard, 1)}</td>}
                              {showBioGuard41 && <td className="p-1 text-center font-semibold">{formatNumber(item.bioGuard41H01, 1)}</td>}
                              {showBioGuard40 && <td className="p-1 text-center font-semibold">{formatNumber(item.bioGuard40H16, 1)}</td>}
                            </tr>
                          ))}
                          <tr className="bg-indigo-50 font-black text-indigo-900">
                            <td className="p-1">{t.labels.total} ({t.labels.kgMonth})</td>
                            <td className="p-1 text-center">{formatNumber(data.consumptionCooling.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0))}</td>
                            <td className="p-1 text-center">{formatNumber(data.consumptionCooling.reduce((acc, item) => acc + (Number(item.runningQuantity) || 0), 0))}</td>
                            {showTotalGuard && (
                              <td className="p-1 text-center">
                                {formatNumber(data.consumptionCooling.reduce((acc, item) => acc + (Number(item.totalGuard) * Number(item.runningQuantity) || 0), 0), 1)}
                              </td>
                            )}
                            {showDepositGuard && (
                              <td className="p-1 text-center">
                                {formatNumber(data.consumptionCooling.reduce((acc, item) => acc + (Number(item.depositGuard) * Number(item.runningQuantity) || 0), 0), 1)}
                              </td>
                            )}
                            {showBioGuard41 && (
                              <td className="p-1 text-center">
                                {formatNumber(data.consumptionCooling.reduce((acc, item) => acc + (Number(item.bioGuard41H01) * Number(item.runningQuantity) || 0), 0), 1)}
                              </td>
                            )}
                            {showBioGuard40 && (
                              <td className="p-1 text-center">
                                {formatNumber(data.consumptionCooling.reduce((acc, item) => acc + (Number(item.bioGuard40H16) * Number(item.runningQuantity) || 0), 0), 1)}
                              </td>
                            )}
                          </tr>
                        </tbody>
                      </table>

                      {/* Yearly Consumption Summary */}
                      <div className="grid grid-cols-4 gap-1.5 mb-2">
                        {showTotalGuard && (
                          <div className="bg-slate-50 p-1.5 border border-slate-100 rounded">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t.labels.totalYearly.replace('{name}', data.coolingTotalGuardName)}</div>
                            <div className="text-[11px] font-black text-indigo-900">
                              {formatNumber(data.consumptionCooling.reduce((acc, item) => acc + (Number(item.totalGuard) * Number(item.runningQuantity) || 0), 0) * 12, 1)}
                            </div>
                          </div>
                        )}
                        {showDepositGuard && (
                          <div className="bg-slate-50 p-1.5 border border-slate-100 rounded">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t.labels.totalYearly.replace('{name}', data.coolingDepositGuardName)}</div>
                            <div className="text-[11px] font-black text-indigo-900">
                              {formatNumber(data.consumptionCooling.reduce((acc, item) => acc + (Number(item.depositGuard) * Number(item.runningQuantity) || 0), 0) * 12, 1)}
                            </div>
                          </div>
                        )}
                        {showBioGuard41 && (
                          <div className="bg-slate-50 p-1.5 border border-slate-100 rounded">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t.labels.totalYearly.replace('{name}', data.coolingBioGuardName)}</div>
                            <div className="text-[11px] font-black text-indigo-900">
                              {formatNumber(data.consumptionCooling.reduce((acc, item) => acc + (Number(item.bioGuard41H01) * Number(item.runningQuantity) || 0), 0) * 12, 1)}
                            </div>
                          </div>
                        )}
                        {showBioGuard40 && (
                          <div className="bg-slate-50 p-1.5 border border-slate-100 rounded">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t.labels.totalYearly.replace('{name}', data.coolingBioGuard40Name)}</div>
                            <div className="text-[11px] font-black text-indigo-900">
                              {formatNumber(data.consumptionCooling.reduce((acc, item) => acc + (Number(item.bioGuard40H16) * Number(item.runningQuantity) || 0), 0) * 12, 1)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Chemical Functions Information */}
                      <div className="p-1.5 bg-slate-50 border border-slate-200 rounded space-y-1.5">
                        <h3 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest border-b border-indigo-100 pb-0.5">{t.labels.chemicalFunctions}</h3>
                        <div className="grid grid-cols-1 gap-1.5 text-[10px]">
                          <div className="flex gap-1.5">
                            <span className="font-bold text-indigo-900 min-w-[100px]">{data.coolingTotalGuardName}:</span>
                            <span className="text-slate-600 italic">{data.descTotalGuard}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <span className="font-bold text-indigo-900 min-w-[100px]">{data.coolingDepositGuardName}:</span>
                            <span className="text-slate-600 italic">{data.descDepositGuard}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <span className="font-bold text-indigo-900 min-w-[100px]">{data.coolingBioGuardName}:</span>
                            <span className="text-slate-600 italic">{data.descBioGuard41}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <span className="font-bold text-indigo-900 min-w-[100px]">{data.coolingBioGuard40Name}:</span>
                            <span className="text-slate-600 italic">{data.descBioGuard40}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Spacer 20px (1 row size 20) */}
                <div className="h-5" />

                <div className="flex items-center gap-1.5 mb-1.5 mt-2">
                  <div className="h-3 w-1 bg-indigo-900"></div>
                  <h2 className="text-[11px] font-black tracking-tight text-indigo-900 uppercase">
                    {t.labels.chillerTitle}
                  </h2>
                </div>
                
                {(() => {
                  const showCorroGuard = data.consumptionChiller.some(item => (item.corroGuard33L01 || 0) > 0);
                  const showBioGuard40 = data.consumptionChiller.some(item => (item.bioGuard40H16 || 0) > 0);

                  return (
                    <>
                      <table className="w-full text-left border-collapse border border-slate-200">
                        <thead>
                          <tr className="bg-indigo-900 text-white">
                            <th className="p-1 text-[10px] font-black uppercase tracking-widest">{t.labels.system}</th>
                            <th className="p-1 text-[10px] font-black uppercase tracking-widest text-center">{t.labels.quantity}</th>
                            <th className="p-1 text-[10px] font-black uppercase tracking-widest text-center">{t.labels.runningQty}</th>
                            {showCorroGuard && <th className="p-1 text-[10px] font-black uppercase tracking-widest text-center">{data.chillerCorroGuardName}</th>}
                            {showBioGuard40 && <th className="p-1 text-[10px] font-black uppercase tracking-widest text-center">{data.chillerBioGuardName}</th>}
                          </tr>
                        </thead>
                        <tbody className="text-[10px]">
                          {data.consumptionChiller.map((item, i) => (
                            <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="p-1 font-bold text-indigo-900">{item.name}</td>
                              <td className="p-1 text-center">{formatNumber(item.quantity)}</td>
                              <td className="p-1 text-center">{formatNumber(item.runningQuantity)}</td>
                              {showCorroGuard && <td className="p-1 text-center font-semibold">{formatNumber(item.corroGuard33L01, 1)}</td>}
                              {showBioGuard40 && <td className="p-1 text-center font-semibold">{formatNumber(item.bioGuard40H16, 1)}</td>}
                            </tr>
                          ))}
                          <tr className="bg-indigo-50 font-black text-indigo-900">
                            <td className="p-1">{t.labels.total} ({t.labels.kgMonth})</td>
                            <td className="p-1 text-center">{formatNumber(data.consumptionChiller.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0))}</td>
                            <td className="p-1 text-center">{formatNumber(data.consumptionChiller.reduce((acc, item) => acc + (Number(item.runningQuantity) || 0), 0))}</td>
                            {showCorroGuard && (
                              <td className="p-1 text-center">
                                {formatNumber(data.consumptionChiller.reduce((acc, item) => acc + (Number(item.corroGuard33L01) * Number(item.runningQuantity) || 0), 0), 1)}
                              </td>
                            )}
                            {showBioGuard40 && (
                              <td className="p-1 text-center">
                                {formatNumber(data.consumptionChiller.reduce((acc, item) => acc + (Number(item.bioGuard40H16) * Number(item.runningQuantity) || 0), 0), 1)}
                              </td>
                            )}
                          </tr>
                        </tbody>
                      </table>

                      {/* Chiller Yearly Consumption Summary */}
                      <div className="grid grid-cols-2 gap-1.5 mb-2 mt-1.5">
                        {showCorroGuard && (
                          <div className="bg-slate-50 p-1.5 border border-slate-100 rounded">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t.labels.totalYearly.replace('{name}', data.chillerCorroGuardName)}</div>
                            <div className="text-[11px] font-black text-indigo-900">
                              {formatNumber(data.consumptionChiller.reduce((acc, item) => acc + (Number(item.corroGuard33L01) * Number(item.runningQuantity) || 0), 0) * 12, 1)}
                            </div>
                          </div>
                        )}
                        {showBioGuard40 && (
                          <div className="bg-slate-50 p-1.5 border border-slate-100 rounded">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t.labels.totalYearly.replace('{name}', data.chillerBioGuardName)}</div>
                            <div className="text-[11px] font-black text-indigo-900">
                              {formatNumber(data.consumptionChiller.reduce((acc, item) => acc + (Number(item.bioGuard40H16) * Number(item.runningQuantity) || 0), 0) * 12, 1)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Chiller Chemical Functions Information */}
                      <div className="p-1.5 bg-slate-50 border border-slate-200 rounded space-y-1.5 mt-1.5">
                        <h3 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest border-b border-indigo-100 pb-0.5">{t.labels.chemicalFunctions}</h3>
                        <div className="grid grid-cols-1 gap-1.5 text-[10px]">
                          <div className="flex gap-1.5">
                            <span className="font-bold text-indigo-900 min-w-[100px]">{data.chillerCorroGuardName}:</span>
                            <span className="text-slate-600 italic">{data.descCorroGuard}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <span className="font-bold text-indigo-900 min-w-[100px]">{data.chillerBioGuardName}:</span>
                            <span className="text-slate-600 italic">{data.descBioGuard40Chiller}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </section>
              
              <div className="mt-auto pt-2 border-t border-slate-100">
              </div>
            </div>
          ) : (
            /* --- Main Report View --- */
            <>
              {/* Header */}
          <header className="border-b-2 border-indigo-900 pb-2 mb-2">
            <div className="flex justify-between items-end">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div>
                    <h1 className="text-sm font-black tracking-tighter leading-none uppercase">
                      {data.systemType === 'CHILLER' ? t.report.titleChiller : t.report.titleCooling}
                    </h1>
                    <p className="text-[10px] font-bold text-slate-800 uppercase tracking-[0.2em] mt-1">
                      {data.systemType === 'CHILLER' ? t.report.subtitleChiller : t.report.subtitleCooling}
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-black uppercase text-indigo-900 border-b border-indigo-100 pb-0.5 mb-0.5">
                  {t.report.customerInfo}
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-1 text-[10px]">
                  <div><span className="font-bold text-indigo-900 uppercase">{t.labels.customer}:</span> {data.customerName}</div>
                  <div><span className="font-bold text-indigo-900 uppercase">{t.labels.date}:</span> {data.date}</div>
                  <div><span className="font-bold text-indigo-900 uppercase">{t.labels.madeBy}:</span> {data.engineerName}</div>
                  <div><span className="font-bold text-indigo-900 uppercase">{t.labels.reportId}:</span> {data.reportId}</div>
                </div>
              </div>
              <div className="bg-slate-100 p-2 border-l-4 border-indigo-600 min-w-[180px]">
                <div className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mb-1">{data.summaryTitle}</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black tracking-tighter text-indigo-900">{data.summaryValue}</span>
                  <span className="text-xs font-bold text-indigo-900">{data.summaryUnit}</span>
                </div>
                <div className="h-1 w-full bg-slate-200 mt-1">
                  <div className="h-full bg-indigo-600" style={{ width: `${Math.min(parseFloat(data.summaryValue), 100)}%` }}></div>
                </div>
              </div>
            </div>
          </header>

          {/* Section I: System Info */}
          <section className="mb-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-5 w-1 bg-indigo-900"></div>
              <h2 className="text-sm font-black tracking-tight text-indigo-900 uppercase flex items-center gap-2">
                I. {data.systemType === 'CHILLER' ? t.report.sectionChiller : t.report.sectionCooling}
              </h2>
            </div>
            <div className="grid grid-cols-12 border border-slate-200">
              <div className={`${data.systemType === 'CHILLER' ? 'col-span-4' : 'col-span-4'} bg-slate-50 p-2 space-y-2 border-r border-slate-200`}>
                <div className="text-[10px] font-black uppercase text-indigo-900 border-b border-indigo-100 pb-0.5 mb-1.5">
                  {t.report.systemSpecs}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <DataRow label={t.labels.equipment} value={data.equipmentName} />
                  <DataRow label={t.labels.material} value={data.material} />
                  {data.systemType === 'CHILLER' && (
                    <DataRow label={t.labels.capacity} value={formatNumber(data.capacityRT) + " RT"} />
                  )}
                  <DataRow label={t.labels.volume} value={formatNumber(data.systemVolume) + " m³"} />
                  <DataRow label={t.labels.flow} value={formatNumber(data.circulationFlow) + " m³/h"} />
                  {data.systemType === 'COOLING_TOWER' ? (
                    <>
                      <DataRow label={t.labels.load} value={formatNumber(metrics.loadPercentage, 1) + "%"} />
                      <DataRow label={t.labels.coc} value={formatNumber(metrics.calculatedCoc, 1)} />
                      <DataRow label="Temp. Supply" value={formatNumber(data.tempOut) + " °C"} />
                      <DataRow label="Temp. Return" value={formatNumber(data.tempIn) + " °C"} />
                    </>
                  ) : (
                    <>
                      <DataRow label={t.labels.leakage} value={formatNumber(data.systemLeakage, 1) + "%/m"} />
                      <DataRow label={t.labels.makeupVol} value={data.chillerMakeupVolume} />
                    </>
                  )}
                  <DataRow label={t.labels.hours} value={formatNumber(data.operatingHours) + " h/d"} />
                  <DataRow label={t.labels.operatingDays} value={formatNumber(data.operatingDaysPerMonth) + " d/m"} />
                </div>
              </div>
              <div className={`${data.systemType === 'CHILLER' ? 'col-span-4' : 'col-span-5'} bg-white p-2 flex flex-col justify-center relative`}>
                <div className="text-[10px] font-black uppercase text-indigo-900 mb-0.5 text-center">
                  {data.systemType === 'CHILLER' ? t.report.diagramChiller : t.report.diagramCooling}
                </div>
                
                {data.systemType === 'COOLING_TOWER' ? (
                  <div className="relative h-48 w-full flex items-center justify-center">
                    {/* Cooling Tower Diagram */}
                    <svg viewBox="0 0 220 160" className="w-full h-full max-w-[240px]">
                      {/* Tower Body */}
                      <path d="M60 120 L140 120 L130 40 L70 40 Z" fill="#f8fafc" stroke="#6366f1" strokeWidth="1.5" />
                      <line x1="70" y1="60" x2="130" y2="60" stroke="#94a3b8" strokeWidth="1" />
                      <line x1="70" y1="80" x2="130" y2="80" stroke="#94a3b8" strokeWidth="1" />
                      <line x1="70" y1="100" x2="130" y2="100" stroke="#94a3b8" strokeWidth="1" />
                      
                      {/* Fan/Top */}
                      <rect x="85" y="30" width="30" height="10" fill="#4f46e5" rx="2" />
                      
                      {/* Flows */}
                      {/* Evaporation */}
                      <path d="M100 30 Q100 10 110 5" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 2" markerEnd="url(#arrow)" />
                      <text x="115" y="10" className="text-[9px] font-bold fill-slate-800">{t.report.evaporation} (E)</text>
                      
                      {/* Makeup */}
                      <path d="M10 90 L60 90" fill="none" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrow)" />
                      <text x="10" y="85" className="text-[9px] font-bold fill-blue-600">{t.report.makeup} (M)</text>
                      
                      {/* Blowdown */}
                      <path d="M100 120 L100 150 L10 150" fill="none" stroke="#ef4444" strokeWidth="1.5" markerEnd="url(#arrow)" />
                      <text x="15" y="145" className="text-[9px] font-bold fill-red-600">{t.report.blowdown} (B)</text>
                      
                      {/* Drift */}
                      <path d="M135 65 Q160 65 185 55" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" markerEnd="url(#arrow)" />
                      <text x="175" y="50" className="text-[8px] font-bold fill-slate-700">{t.report.drift} (D)</text>

                      {/* Recirculation */}
                      <path d="M140 100 L170 100 L170 40 L130 40" fill="none" stroke="#6366f1" strokeWidth="1.5" markerEnd="url(#arrow)" />
                      <text x="185" y="70" className="text-[9px] font-bold fill-indigo-600" style={{writingMode: 'vertical-rl'}}>{t.report.recirculation} (R)</text>
                      
                      {/* Temperature Labels */}
                      
                      <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                        </marker>
                      </defs>
                    </svg>
                    
                    {/* Flow Values Overlay */}
                    <div className="absolute top-0 left-2 p-1 bg-white print-bg-white z-20 min-w-[80px]">
                      <div className="flex justify-between gap-3 border-b border-slate-50 pb-0.5">
                        <span className="text-[8px] font-bold text-slate-800">M:</span> 
                        <span className="text-[8px] font-black text-indigo-900">{metrics.makeup > 0 ? `${metrics.makeup.toFixed(2)} m³/h` : "-"}</span>
                      </div>
                      <div className="flex justify-between gap-3 border-b border-slate-50 pb-0.5">
                        <span className="text-[8px] font-bold text-slate-800">E:</span> 
                        <span className="text-[8px] font-black text-indigo-900">{formatNumber(metrics.evaporation, 2)} m³/h</span>
                      </div>
                      <div className="flex justify-between gap-3 border-b border-slate-50 pb-0.5">
                        <span className="text-[8px] font-bold text-slate-800">B:</span> 
                        <span className="text-[8px] font-black text-indigo-900">{formatNumber(metrics.blowdown, 2)} m³/h</span>
                      </div>
                      <div className="flex justify-between gap-3 border-b border-slate-50 pb-0.5">
                        <span className="text-[8px] font-bold text-slate-800">D:</span> 
                        <span className="text-[8px] font-black text-indigo-900">{formatNumber(metrics.drift, 2)} m³/h</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-[8px] font-bold text-slate-800">ΔT:</span> 
                        <span className="text-[8px] font-black text-indigo-900">{formatNumber(metrics.deltaT, 1)} °C</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-48 w-full flex items-center justify-center">
                    <svg viewBox="-50 0 250 120" className="w-full h-full max-w-[280px]">
                      {/* Chiller Unit Body */}
                      <rect x="60" y="30" width="80" height="60" fill="#f8fafc" stroke="#6366f1" strokeWidth="1.5" rx="4" />
                      <text x="100" y="65" textAnchor="middle" className="text-[10px] font-black fill-indigo-900 uppercase">{t.sidebar.chiller}{t.chiller.unit}</text>
                      
                      {/* Chilled Water Loop (Evaporator) - Blue */}
                      <path d="M60 45 L-10 45" fill="none" stroke="#3b82f6" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
                      <text x="-45" y="40" className="text-[10px] font-bold fill-blue-600">{t.chiller.supply}: {data.tempOut > 0 ? `${data.tempOut}°C` : "-"}</text>
                      
                      <path d="M-10 75 L60 75" fill="none" stroke="#3b82f6" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
                      <text x="-45" y="85" className="text-[10px] font-bold fill-blue-600">{t.chiller.return}: {data.tempIn > 0 ? `${data.tempIn}°C` : "-"}</text>
                      
                      {/* Condenser Water Loop - Red/Orange */}
                      <path d="M140 45 L185 45" fill="none" stroke="#f59e0b" strokeWidth="1.5" markerEnd="url(#arrow-orange)" />
                      <text x="145" y="40" className="text-[10px] font-bold fill-amber-600">{t.chiller.cwReturn}</text>
                      
                      <path d="M185 75 L140 75" fill="none" stroke="#f59e0b" strokeWidth="1.5" markerEnd="url(#arrow-orange)" />
                      <text x="145" y="85" className="text-[10px] font-bold fill-amber-600">{t.chiller.cwSupply}</text>

                      <defs>
                        <marker id="arrow-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3" markerHeight="3" orient="auto">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                        </marker>
                        <marker id="arrow-orange" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3" markerHeight="3" orient="auto">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                        </marker>
                      </defs>
                    </svg>
                  </div>
                )}
              </div>
              <div className={`${data.systemType === 'CHILLER' ? 'col-span-4' : 'col-span-3'} bg-slate-50 p-2 space-y-2 border-l border-slate-200`}>
                <div className="text-[10px] font-black uppercase text-indigo-900 border-b border-indigo-100 pb-1 mb-1.5">
                  {data.systemType === 'CHILLER' ? t.report.operatingData : t.sections.makeup}
                </div>
                <div className="flex flex-col space-y-1.5">
                  {data.systemType === 'CHILLER' ? (
                    <>
                      <DataRow label={t.labels.tempOut} value={formatNumber(data.tempOut, 1) + " °C"} />
                      <DataRow label={t.labels.tempIn} value={formatNumber(data.tempIn, 1) + " °C"} />
                      <DataRow label={t.labels.deltaT} value={formatNumber(metrics.deltaT, 1) + " °C"} />
                      <DataRow label={t.labels.load} value={formatNumber(metrics.loadPercentage, 1) + "%"} />
                      <div className="pt-1 mt-1 border-t border-indigo-100 space-y-1.5">
                        <DataRow label={t.labels.makeupTypeChiller} value={data.makeupType} boldLabel={true} />
                        <DataRow label="pH" value={data.makeupPh} />
                        <DataRow label="EC" value={formatNumber(data.makeupEc) + " µS/cm"} />
                        <DataRow label={t.labels.hardness} value={formatNumber(data.makeupHardness) + " ppm"} />
                        <DataRow label={t.labels.chlorides} value={formatNumber(data.makeupChloride) + " ppm"} />
                        <DataRow label={t.labels.sulfate} value={formatNumber(data.makeupSulfate) + " ppm"} />
                      </div>
                    </>
                  ) : (
                    <>
                      <DataRow label={t.labels.makeupType} value={data.makeupType} boldLabel={true} />
                      <DataRow label="pH" value={data.makeupPh} />
                      <DataRow label="EC" value={formatNumber(data.makeupEc) + " µS/cm"} />
                      <DataRow label={t.labels.hardness} value={formatNumber(data.makeupHardness) + " ppm"} />
                      <DataRow label={t.labels.silica} value={formatNumber(data.makeupSilica) + " ppm"} />
                      <DataRow label={t.labels.chlorides} value={formatNumber(data.makeupChloride) + " ppm"} />
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Section II: Standards & Chemicals */}
          <section className="mt-2 mb-3 grid grid-cols-[43%_1fr] gap-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-1 bg-indigo-600"></div>
                  <h2 className="text-sm font-black tracking-tight text-indigo-900 uppercase">
                    IIa. {data.systemType === 'CHILLER' ? t.report.waterAnalysisChiller : t.report.waterAnalysisCooling}
                  </h2>
                </div>
                {data.samplingNote && (
                  <span className="text-[8px] font-bold text-slate-500 italic">{data.samplingNote}</span>
                )}
              </div>
              <div className="grid grid-cols-[1fr_75px_70px_20px] gap-1 mb-1 px-1 border-b border-indigo-100 pb-1">
                <div className="text-[8px] font-black uppercase text-slate-500">Parameter</div>
                <div className="text-[8px] font-black uppercase text-indigo-900 text-center">{data.samplingTimeHeader}</div>
                <div className="text-[8px] font-black uppercase text-slate-500 text-center">Standard</div>
                <div></div>
              </div>
              <div className="grid grid-cols-1 gap-[5px]">
                {data.systemType === 'COOLING_TOWER' ? (
                  <>
                    <TableRowCompact label="Temp. Cooling Water" value={data.tempOut} unit="°C" standard={data.towerStandards.tempCoolingWater} />
                    <TableRowCompact label={t.labels.phLevel} value={data.measuredPh} standard={data.towerStandards.ph} />
                    <TableRowCompact label={t.labels.turbidity} value={data.measuredTurbidityTower} standard={data.towerStandards.turbidity} />
                    <TableRowCompact label={t.labels.conductivity} value={data.measuredConductivity} unit="µS/cm" standard={data.towerStandards.conductivity} />
                    <TableRowCompact label={t.labels.hardness} value={data.measuredHardness} unit="ppm" standard={data.towerStandards.hardness} />
                    <TableRowCompact label={t.labels.alkalinity} value={data.measuredMAlk} unit="ppm" standard={data.towerStandards.alkalinity} />
                    <TableRowCompact label={t.labels.iron} value={data.measuredIron} unit="ppm" standard={data.towerStandards.iron} />
                    <TableRowCompact label={t.labels.silica} value={data.measuredSilica} unit="ppm" standard={data.towerStandards.silica} />
                    <TableRowCompact label={t.labels.chlorides} value={data.measuredChlorides} unit="ppm" standard={data.towerStandards.chlorides} />
                    <TableRowCompact label={t.labels.freeChloride} value={data.measuredFreeChloride} unit="ppm" standard={data.towerStandards.freeChloride} />
                    <TableRowCompact label="Bacteria" value={data.measuredBacteriaTower} standard={data.towerStandards.bacteria} />
                    <TableRowCompact label={t.labels.cycle} value={data.makeupEc > 0 ? formatNumber(data.measuredConductivity / data.makeupEc, 1) : null} standard={data.towerStandards.cycle} />
                    <TableRowCompact label={t.labels.phosphate} value={data.measuredPhosphate} unit="ppm" standard={data.towerStandards.phosphate} />
                    <TableRowCompact label={t.labels.lsiIndex} value={metrics.calculatedLsi !== null ? formatNumber(metrics.calculatedLsi, 2) : "-"} standard={data.towerStandards.lsi} />
                    <TableRowCompact label={t.labels.msCorrTower} value={data.measuredMildSteelCorrosionTower} unit="mpy" standard={data.towerStandards.msCorr} />
                    <TableRowCompact label={t.labels.cuCorrTower} value={data.measuredCopperCorrosionTower} unit="mpy" standard={data.towerStandards.cuCorr} />
                    <TableRowCompact label="COD" value={data.measuredCodTower} unit="ppm" standard={data.towerStandards.cod} />
                  </>
                ) : (
                  <>
                    <TableRowCompact isChiller={true} label={t.labels.phLevel} value={data.measuredPh} standard={data.chillerStandards.ph} />
                    <TableRowCompact isChiller={true} label={t.labels.conductivity} value={data.measuredConductivity} unit="µS/cm" standard={data.chillerStandards.conductivity} />
                    <TableRowCompact isChiller={true} label={t.labels.alkalinity} value={data.measuredMAlk} unit="ppm" standard={data.chillerStandards.alkalinity} />
                    <TableRowCompact isChiller={true} label={t.labels.chlorides} value={data.measuredChlorides} unit="ppm" standard={data.chillerStandards.chlorides} />
                    <TableRowCompact isChiller={true} label={t.labels.iron} value={data.measuredIron} unit="ppm" standard={data.chillerStandards.iron} />
                    <TableRowCompact isChiller={true} label={t.labels.copper} value={data.measuredCopper} unit="ppm" standard={data.chillerStandards.copper} />
                    <TableRowCompact isChiller={true} label={t.labels.bacteria} value={data.measuredBacteria} standard={data.chillerStandards.bacteria} />
                    <TableRowCompact isChiller={true} label={t.labels.nitrite} value={data.measuredNitrite} unit="ppm" standard={data.chillerStandards.nitrite} />
                    <TableRowCompact isChiller={true} label={t.labels.sulfate} value={data.measuredSulfate} unit="ppm" standard={data.chillerStandards.sulfate} />
                    <TableRowCompact isChiller={true} label={t.labels.cuCorr} value={data.measuredCopperCorrosion} unit="mpy" standard={data.chillerStandards.cuCorr} />
                    <TableRowCompact isChiller={true} label={t.labels.msCorr} value={data.measuredMildSteelCorrosion} unit="mpy" standard={data.chillerStandards.msCorr} />
                  </>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-5 w-1 bg-indigo-600"></div>
                <h2 className="text-sm font-black tracking-tight text-indigo-900 uppercase">IIb. {t.report.chemicalProgram}</h2>
              </div>
              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-indigo-900 text-white">
                    <th rowSpan={2} className="p-1 px-2 text-[9px] font-black uppercase tracking-widest border-r border-indigo-800/30" style={{ width: '32%' }}>
                      {t.report.chemical}
                    </th>
                    <th rowSpan={2} className="p-1 px-1.5 text-[9px] font-black uppercase tracking-widest text-center border-r border-indigo-800/30" style={{ width: '15%' }}>
                      {language === 'VI' ? 'LIỀU DÙNG' : 'DOSAGE'} <br/> (PPM)
                    </th>
                    {data.systemType === 'CHILLER' && (
                      <th rowSpan={2} className="p-1 px-1.5 text-[9px] font-black uppercase tracking-widest text-center border-r border-indigo-800/30 whitespace-pre-line" style={{ width: '13%' }}>
                        {t.report.kgInitial}
                      </th>
                    )}
                    <th colSpan={data.systemType === 'CHILLER' ? 2 : 3} className="p-1 text-[9px] font-black uppercase tracking-widest text-center border-b border-indigo-800/30">
                      {language === 'VI' ? 'Tiêu thụ' : 'Consumption'}
                    </th>
                  </tr>
                  <tr className="bg-indigo-900 text-white">
                    {data.systemType !== 'CHILLER' && (
                      <th className="p-1 text-[9px] font-black uppercase tracking-widest text-center border-r border-indigo-800/30" style={{ width: '13%' }}>{t.report.kgDay}</th>
                    )}
                    <th className="p-1 text-[9px] font-black uppercase tracking-widest text-center border-r border-indigo-800/30" style={{ width: '13%' }}>{t.report.kgMonth}</th>
                    <th className="p-1 text-[9px] font-black uppercase tracking-widest text-center" style={{ width: '14%' }}>{t.report.kgYear}</th>
                  </tr>
                </thead>
                <tbody className="text-[10px]">
                  {metrics.updatedChemicals.filter(chem => chem.dosage > 0).map((chem, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="p-1 px-1.5 whitespace-nowrap">
                        <div className="font-bold">{chem.name}</div>
                        <div className="text-[8px] text-slate-700 uppercase">
                          {t.chemicals[chem.type as keyof typeof t.chemicals] || chem.type}
                        </div>
                      </td>
                      <td className="p-1 px-1.5 font-semibold text-center">{formatDisplayValue(chem.dosage)}</td>
                      {data.systemType === 'CHILLER' && (
                        <td className="p-1 px-1.5 font-semibold text-center">{formatNumber(chem.kgInitial, 1)}</td>
                      )}
                      {data.systemType !== 'CHILLER' && (
                        <td className="p-1 px-1.5 font-semibold text-center">
                          {data.systemType === 'COOLING_TOWER' && chem.type === "nonOxidizing" ? "-" : formatNumber(chem.kgDay, 1)}
                        </td>
                      )}
                      <td className="p-1 px-1.5 font-semibold text-center">{formatNumber(chem.kgMonth, 1)}</td>
                      <td className="p-1 px-1.5 font-semibold text-center">{formatNumber(chem.kgYear, 0)}</td>
                    </tr>
                  ))}
                  <tr className="bg-indigo-50 text-indigo-900 font-black">
                    <td className="p-1 px-1.5 text-[9px] uppercase" colSpan={2}>{t.labels.total}</td>
                    {data.systemType === 'CHILLER' && (
                      <td className="p-1 px-1.5 text-center">
                        {formatNumber(metrics.updatedChemicals.filter(c => c.dosage > 0).reduce((acc, c) => acc + (c.kgInitial || 0), 0), 1)}
                      </td>
                    )}
                    {data.systemType !== 'CHILLER' && (
                      <td className="p-1 px-1.5 text-center">
                        {formatNumber(metrics.updatedChemicals.filter(c => c.dosage > 0).reduce((acc, c) => acc + (data.systemType === 'COOLING_TOWER' && c.type === "nonOxidizing" ? 0 : c.kgDay), 0), 1)}
                      </td>
                    )}
                    <td className="p-1 px-1.5 text-center">
                      {formatNumber(metrics.updatedChemicals.filter(c => c.dosage > 0).reduce((acc, c) => acc + c.kgMonth, 0), 1)}
                    </td>
                    <td className="p-1 px-1.5 text-center">
                      {formatNumber(metrics.updatedChemicals.filter(c => c.dosage > 0).reduce((acc, c) => acc + c.kgYear, 0), 0)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[9px] font-black text-indigo-900 uppercase mb-0.5">{t.sections.notes}</div>
                <div className="text-[10px] space-y-0.5 text-slate-800 whitespace-pre-line leading-snug">
                  {data.systemType === 'CHILLER' ? data.chillerOperatingNotes : data.towerOperatingNotes}
                </div>
              </div>
            </div>
          </section>
          <div className="mb-2 px-1 text-[8px] text-slate-500 italic font-medium whitespace-nowrap">
            {t.report.waterStandardNote}
          </div>

          {/* Section III: Recommendations */}
          <section className="flex-grow">
            <div className="flex items-center gap-3 mb-1.5 mt-1.5">
              <div className="h-5 w-1 bg-amber-500"></div>
              <h2 className="text-sm font-black tracking-tight text-indigo-900 uppercase">III. {t.report.techRecommendations}</h2>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(data.systemType === 'CHILLER' ? data.chillerRecommendations : data.towerRecommendations).map((rec, i) => (
                <RecommendationCard 
                  key={i}
                  title={rec.title}
                  desc={rec.desc}
                  icon={i === 0 ? <Info className="w-4 h-4" /> : i === 1 ? <Settings2 className="w-4 h-4" /> : i === 2 ? <Zap className="w-4 h-4" /> : <Calculator className="w-4 h-4" />}
                />
              ))}
            </div>
          </section>

          {/* Page Number (Bottom Center) */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-400 uppercase tracking-widest">
            {t.labels.pageNumber}: {data.pageNumber}
          </div>
            </>
          )}
        </div>

        {/* Global Print Styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body { background: white !important; padding: 0 !important; margin: 0 !important; }
            .no-print { display: none !important; }
            .print-bg-white { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-text-indigo { color: #312e81 !important; }
            .a4-page { 
              box-shadow: none !important; 
              margin: 0 !important; 
              width: 210mm !important; 
              height: 297mm !important; 
              padding: 5mm 15mm 15mm 15mm !important;
              border: none !important;
            }
            main { padding: 0 !important; overflow: visible !important; }
          }
          .a4-page {
            width: 210mm;
            height: 297mm;
            min-height: 297mm;
          }
        `}} />
          </div>
        </div>
      </main>

      {/* --- Email Prompt Modal --- */}
      <AnimatePresence>
        {showEmailPrompt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 no-print"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 flex items-center justify-center rounded-2xl mb-6 mx-auto">
                  <Mail className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 text-center mb-2">Xác nhận Email</h3>
                <p className="text-slate-500 text-center text-sm mb-8">
                  Vui lòng nhập email của bạn để tiếp tục tải báo cáo. Chúng tôi sẽ lưu lại thông tin xuất file này.
                </p>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email"
                      placeholder="your@email.com"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <button 
                      onClick={() => {
                        setShowEmailPrompt(false);
                        setPendingExportAction(null);
                      }}
                      className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      onClick={() => {
                        if (!guestEmail || !guestEmail.includes('@')) {
                          alert('Vui lòng nhập email hợp lệ');
                          return;
                        }
                        setShowEmailPrompt(false);
                        if (pendingExportAction) pendingExportAction();
                        setPendingExportAction(null);
                      }}
                      className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-100"
                    >
                      Tiếp tục
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Hoặc <button onClick={handleLogin} className="text-indigo-600 hover:underline">Đăng nhập bằng Google</button>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const formatNumber = (val: any, decimals: number = 0) => {
  if (val === "" || val === null || val === undefined) return "-";
  const num = Number(val);
  if (isNaN(num)) return val;
  if (num === 0) return "-";
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

const formatDisplayValue = (value: any) => {
  if (value === "" || value === null || value === undefined || (typeof value === 'number' && isNaN(value))) return "-";
  if (typeof value === 'string' && value.trim() === "") return "-";
  
  // If it's a number, format it with commas
  if (typeof value === 'number') {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
  }
  
  // If it's a string that is purely a number, format it too
  if (typeof value === 'string' && !isNaN(Number(value)) && !value.includes('/') && !value.includes('-')) {
    const num = Number(value);
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num);
  }
  
  return value;
};

const parseStandardAndCheck = (value: any, standard: string): boolean => {
  if (value === null || value === undefined || value === "" || value === "-") return true;
  if (!standard) return true;

  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  if (isNaN(numValue)) return true;

  const cleanStd = standard.toLowerCase().trim();

  // Handle range: "min - max" or "(min - max)"
  const rangeMatch = cleanStd.match(/([0-9.]+)\s*-\s*([0-9.]+)/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    return numValue >= min && numValue <= max;
  }

  // Handle less than: "< max" or "max max"
  if (cleanStd.includes('<') || cleanStd.includes('max')) {
    const maxMatch = cleanStd.match(/([0-9.]+)/);
    if (maxMatch) {
      const max = parseFloat(maxMatch[1]);
      return numValue <= max;
    }
  }

  // Handle greater than: "> min"
  if (cleanStd.includes('>')) {
    const minMatch = cleanStd.match(/([0-9.]+)/);
    if (minMatch) {
      const min = parseFloat(minMatch[1]);
      return numValue >= min;
    }
  }

  return true;
};

function TableRowCompact({ label, value, unit = "", standard, isChiller = false }: any) {
  const displayValue = formatDisplayValue(value);
  const hasValue = displayValue !== "-";
  const status = parseStandardAndCheck(value, standard);

  return (
    <div className={`grid grid-cols-[1fr_75px_70px_20px] items-center py-[5px] px-1 border-l-2 print-bg-white ${!hasValue ? 'border-slate-200 bg-slate-50/50' : status ? 'border-indigo-600 bg-slate-50' : 'border-amber-500 bg-amber-50'}`}>
      <span className="text-[9px] font-bold uppercase tracking-tight leading-none truncate pr-1">{label}</span>
      <span className="text-[10px] font-black leading-none text-center whitespace-nowrap">{displayValue}{hasValue && unit ? ` ${unit}` : ""}</span>
      <span className="text-[8px] text-slate-700 italic leading-none text-center">({standard})</span>
      <div className="flex justify-center">
        {!hasValue ? null : status ? (
          <CheckCircle2 className="w-2.5 h-2.5 text-indigo-600" />
        ) : (
          <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
        )}
      </div>
    </div>
  );
}

function RecommendationCard({ title, desc, icon }: any) {
  return (
    <div className="bg-slate-50 print-bg-white p-2.5 border-t-2 border-indigo-900">
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className="text-indigo-900">{icon}</div>
        <h4 className="text-[9px] font-black uppercase tracking-wider leading-tight">{title}</h4>
      </div>
      <p className="text-[9px] leading-snug text-slate-800">{desc}</p>
    </div>
  );
}

function DataRow({ label, value, large, boldLabel }: any) {
  const displayValue = formatDisplayValue(value);
  
  return (
    <div className={`flex justify-between items-end border-b border-slate-100 ${large ? 'py-1' : 'pb-0.5'}`}>
      <span className={`${large ? 'text-[12px]' : 'text-[10px]'} ${boldLabel ? 'font-black' : 'font-medium'} text-slate-800 leading-tight`}>{label}</span>
      <span className={`${large ? 'text-[13px]' : 'text-[10px]'} font-black text-indigo-900 leading-tight`}>{displayValue}</span>
    </div>
  );
}

function MetricCard({ label, value, unit, icon, highlight }: any) {
  const displayValue = formatDisplayValue(value);
  const displayUnit = displayValue === "-" ? "" : unit;

  return (
    <div className={`p-3 border ${highlight ? 'bg-indigo-900 border-indigo-900 print-bg-white' : 'bg-white border-slate-100'} shadow-sm`}>
      <div className={`flex items-center gap-2 mb-1.5 ${highlight ? 'text-indigo-200' : 'text-slate-700'}`}>
        {icon}
        <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-lg font-black ${highlight ? 'text-white' : 'text-indigo-900'}`}>{displayValue}</span>
        <span className={`text-[10px] font-bold ${highlight ? 'text-indigo-300' : 'text-slate-700'}`}>{displayUnit}</span>
      </div>
    </div>
  );
}

function TableRow({ label, value, standard, status }: any) {
  const displayValue = formatDisplayValue(value);

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
      <td className="p-3 font-bold text-slate-700">{label}</td>
      <td className="p-3 font-black text-indigo-900">{displayValue}</td>
      <td className="p-3 text-slate-800 italic">{standard}</td>
      <td className="p-3 text-center">
        {status ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />
        )}
      </td>
    </tr>
  );
}

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-lg transition-all ${active ? 'bg-white shadow-md text-indigo-600 scale-105 z-10' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}
  >
    <div className={`mb-1 transition-transform ${active ? 'scale-110' : ''}`}>{icon}</div>
    <span className="text-[8px] font-black uppercase tracking-tighter truncate w-full text-center">
      {label}
    </span>
  </button>
);
