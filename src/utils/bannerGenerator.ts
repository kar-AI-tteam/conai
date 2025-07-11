import { generateGradient } from './gradientUtils';

interface BannerStyle {
  gradient: string;
  textColor: string;
  iconName?: string;
  pattern?: string;
}

const BANNER_STYLES: BannerStyle[] = [
  {
    gradient: 'from-green-400 to-blue-500',
    textColor: 'text-white',
    pattern: 'radial-gradient(circle at 20% 110%, rgba(255, 255, 255, 0.1) 10%, transparent 20%)'
  },
  {
    gradient: 'from-purple-500 to-pink-500',
    textColor: 'text-white',
    pattern: 'linear-gradient(45deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%)'
  },
  {
    gradient: 'from-yellow-400 via-red-500 to-pink-500',
    textColor: 'text-white',
    pattern: 'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0px, transparent 5px)'
  },
  {
    gradient: 'from-green-300 via-blue-500 to-purple-600',
    textColor: 'text-white',
    pattern: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 2px, transparent 4px)'
  },
  {
    gradient: 'from-[#FF512F] to-[#DD2476]',
    textColor: 'text-white',
    pattern: 'linear-gradient(30deg, rgba(255, 255, 255, 0.1) 12%, transparent 12.5%, transparent 87%)'
  }
];

interface BannerSize {
  name: string;
  width: string;
  textSize: string;
  padding: string;
}

const BANNER_SIZES: BannerSize[] = [
  {
    name: 'small',
    width: 'w-1/4',
    textSize: 'text-sm',
    padding: 'p-3'
  },
  {
    name: 'medium',
    width: 'w-1/3',
    textSize: 'text-base',
    padding: 'p-4'
  },
  {
    name: 'large',
    width: 'w-5/12',
    textSize: 'text-lg',
    padding: 'p-6'
  }
];

const getRandomStyle = (): BannerStyle => {
  return BANNER_STYLES[Math.floor(Math.random() * BANNER_STYLES.length)];
};

const generateSingleBanner = (text: string, style: BannerStyle, size: BannerSize): string => {
  return `
    <div class="${size.width} px-2">
      <div class="relative overflow-hidden rounded-lg ${size.padding} bg-gradient-to-r ${style.gradient} shadow-lg h-full">
        <div class="absolute inset-0" style="background-image: ${style.pattern}; opacity: 0.1"></div>
        <div class="relative z-10 flex items-center justify-between h-full">
          <div class="flex-1">
            <h3 class="${size.textSize} font-bold ${style.textColor} mb-1">${text}</h3>
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                ${new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const generateBannerHTML = (text: string): string => {
  const style = getRandomStyle();
  
  return `
    <div class="flex flex-wrap -mx-2">
      ${BANNER_SIZES.map(size => generateSingleBanner(text, style, size)).join('')}
    </div>
  `;
};