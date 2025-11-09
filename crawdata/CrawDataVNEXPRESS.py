from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time
import json
import random
from datetime import datetime


class VnExpressScraper:
    def __init__(self):
        # Cấu hình Chrome options
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])
        chrome_options.add_experimental_option('excludeSwitches', ['enable-automation'])
        chrome_options.add_experimental_option('useAutomationExtension', False)

        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        self.wait = WebDriverWait(self.driver, 10)

        
        self.categories = [
            {
                'name': 'Chính trị',
                'url': 'https://vnexpress.net/thoi-su',
                'category_id': 1
            },
            {
                'name': 'Sức khỏe',
                'url': 'https://vnexpress.net/suc-khoe',
                'category_id': 2
            },
            {
                'name': 'Khoa học',
                'url': 'https://vnexpress.net/khoa-hoc-cong-nghe/bo-khoa-hoc-va-cong-nghe',
                'category_id': 3
            },
            {
                'name': 'Công nghệ',
                'url': 'https://vnexpress.net/khoa-hoc-cong-nghe/ai',
                'category_id': 4
            },
            {
                'name': 'Kinh doanh',
                'url': 'https://vnexpress.net/goc-nhin',
                'category_id': 5
            },
            {
                'name': 'Thể thao',
                'url': 'https://vnexpress.net/the-thao',
                'category_id': 6
            }
        ]


    # ========= Lấy danh sách link bài viết từ trang danh mục ==========
    def get_article_links(self, category_url, sl=5):
        self.driver.get(category_url)
        time.sleep(3)

        link_bai_viet = []
        bai_viet = self.driver.find_elements(By.CSS_SELECTOR, 'h3.title-news a, h2.title-news a, h3 a.title-news')

        for s in bai_viet[:sl]:
            link = s.get_attribute('href')
            if link and link.startswith('https://vnexpress.net/'):
                link_bai_viet.append(link)

        return list(set(link_bai_viet))[:sl]

    # ========= Craw dữ liều từng bài viết ==========
    def craw_post(self, url, category_id):
        
        try:
            self.driver.get(url)
            time.sleep(2)

            crawl_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

            # Lấy tiêu đề
            title = ''
            try:
                title_element = self.driver.find_element(By.CSS_SELECTOR, 'h1.title-detail')
                title = title_element.text.strip()
            except:
                try:
                    title_element = self.driver.find_element(By.CSS_SELECTOR, 'h1')
                    title = title_element.text.strip()
                except:
                    title = 'Không có tiêu đề'

            # Lấy nội dung
            content = ''
            try:
                description = self.driver.find_element(By.CSS_SELECTOR, 'p.description').text.strip()
                content_elements = self.driver.find_elements(By.CSS_SELECTOR, 'article.fck_detail p.Normal')
                content_text = '\n'.join([elem.text.strip() for elem in content_elements if elem.text.strip()])
                content = description + '\n\n' + content_text
            except:
                content = 'Không thể lấy nội dung'

            return {
                "user_id": random.choice([8, 9]),
                "category_id": category_id,
                "title": title,
                "content": content,
                "status": "published",
                "published_at": crawl_time,
                "updated_at": None,
                "credibility_score": 99.0,
                "credibility_label": "Thật",
                "created_at": crawl_time
            }

        except Exception as e:
            return None

    def start_crawk(self, articles_per_category=5):
        
        res = []

        for category in self.categories:

            try:
                # Lấy danh sách link bài viết
                article_links = self.get_article_links(category['url'], articles_per_category)

                # Cào từng bài viết
                for i, link in enumerate(article_links, 1):
                    article_data = self.craw_post(link, category['category_id'])

                    if article_data:
                        res.append(article_data)
                    time.sleep(1)  

            except Exception as e:
                continue

        return res

    def save_to_json(self, data, filename='data.json'):
        """Lưu dữ liệu vào file JSON"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
    def close(self):
        """Đóng browser"""
        self.driver.quit()


# Sử dụng
if __name__ == '__main__':
    scraper = VnExpressScraper()
    try:
        # ==== CRAWL ====
        articles = scraper.start_crawk(articles_per_category=8)

        # Lưu vào file JSON
        scraper.save_to_json(articles)


    finally:
        scraper.close()
        