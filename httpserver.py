from http.server import *
from http import cookies

def parse_info(data):
    data = data.split('\r\n')
    cm = {}
    for i in data:
        t = i.split('=')
        cm[t[0]] = t[1]
    ret = '<p>Sorry, no content here :(</p>|'
    return ret

class SHTTPRH(SimpleHTTPRequestHandler):
    def do_POST(self):
        # Doesn't do anything with posted data
        content_length = int(self.headers['Content-Length']) # <--- Gets the size of data
        post_data = self.rfile.read(content_length) # <--- Gets the data itself
        post_data = post_data.decode('utf-8')
        print(post_data)
        ret = parse_info(post_data)
        
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(ret.encode('utf-8'))

        f = self.send_head()
        if f:
            f.close()

server_address = ('', 80)
httpd = HTTPServer(server_address, SHTTPRH)
httpd.RequestHandlerClass.default_request_version = 'HTTP/1.1'
#httpd.RequestHandlerClass.error_message_format = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"\n"http://www.w3.org/TR/html4/strict.dtd">\n<html>\n<head>\n<meta http-equiv="Content-Type" content="text/html;charset=utf-8">\n<title>Error %(code)d  %(message)s</title>\n</head>\n<body>\n<h1>Error %(code)d</h1>\n<img src="https://http.cat/%(code)d" width="350">\n<p>Error code: %(code)d</p>\n<p>Message: %(message)s.</p>\n<p>Error code explanation: %(code)s - %(explain)s.</p>\n</body>\n</html>'
httpd.serve_forever()
