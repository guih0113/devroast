export const CODE_SNIPPETS: Record<string, { code: string; fileName: string }[]> = {
  javascript: [
    {
      fileName: 'utils.js',
      code: `function getUserData(id) {
  var data = null
  $.ajax({
    url: '/api/users/' + id,
    async: false,
    success: function(res) { data = res }
  })
  return data
}`
    },
    {
      fileName: 'auth.js',
      code: `function login(user, pass) {
  if (user == 'admin' && pass == 'admin123') {
    document.cookie = 'loggedIn=true'
    return true
  }
  return false
}`
    },
    {
      fileName: 'calculate.js',
      code: `function calculateTotal(items) {
  let total = 0
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price
  }
  if (total > 100) {
    console.log('discount applied')
    total = total * 0.9
  }
  // TODO: handle tax
  return total
}`
    },
    {
      fileName: 'fetchData.js',
      code: `async function fetchData(url) {
  try {
    const res = await fetch(url)
    const json = await res.json()
    return json
  } catch(e) {
    console.log(e)
    return null
  }
}`
    },
    {
      fileName: 'sort.js',
      code: `function sortUsers(users) {
  for (var i = 0; i < users.length; i++) {
    for (var j = 0; j < users.length - i - 1; j++) {
      if (users[j].name > users[j+1].name) {
        var temp = users[j]
        users[j] = users[j+1]
        users[j+1] = temp
      }
    }
  }
  return users
}`
    }
  ],
  typescript: [
    {
      fileName: 'service.ts',
      code: `class UserService {
  private users: any[] = []

  getUser(id: any): any {
    for (let i = 0; i < this.users.length; i++) {
      if (this.users[i].id == id) return this.users[i]
    }
    return null
  }

  addUser(user: any) {
    this.users.push(user)
  }
}`
    },
    {
      fileName: 'api.ts',
      code: `async function callApi(endpoint: string, data: any) {
  const response = await fetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  })
  // @ts-ignore
  return response.json()
}`
    },
    {
      fileName: 'reducer.ts',
      code: `function reducer(state: any = {}, action: any) {
  if (action.type == 'SET_USER') {
    state.user = action.payload
    return state
  }
  if (action.type == 'CLEAR') {
    state = {}
    return state
  }
  return state
}`
    },
    {
      fileName: 'validate.ts',
      code: `function validateEmail(email: string): boolean {
  if (email.indexOf('@') > -1) {
    return true
  } else {
    return false
  }
}

function validateAge(age: number): boolean {
  if (age >= 0 && age <= 150) {
    return true
  } else {
    return false
  }
}`
    }
  ],
  python: [
    {
      fileName: 'db.py',
      code: `import sqlite3

def get_user(username, password):
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    query = "SELECT * FROM users WHERE username='" + username + "' AND password='" + password + "'"
    cursor.execute(query)
    return cursor.fetchone()`
    },
    {
      fileName: 'utils.py',
      code: `def flatten(lst):
    result = []
    for item in lst:
        if type(item) == list:
            for sub in item:
                result.append(sub)
        else:
            result.append(item)
    return result`
    },
    {
      fileName: 'cache.py',
      code: `cache = {}

def get_data(key):
    if cache.has_key(key):
        return cache[key]
    data = fetch_from_db(key)
    cache[key] = data
    return data`
    },
    {
      fileName: 'api.py',
      code: `import requests

def call_api(url, data):
    try:
        r = requests.post(url, json=data, timeout=None, verify=False)
        return r.json()
    except:
        pass`
    }
  ],
  sql: [
    {
      fileName: 'queries.sql',
      code: `SELECT *
FROM users u, orders o, products p, categories c
WHERE u.id = o.user_id
AND o.product_id = p.id
AND p.category_id = c.id
AND u.active = 1
ORDER BY u.name`
    },
    {
      fileName: 'report.sql',
      code: `SELECT name, email, password, ssn, credit_card
FROM customers
WHERE YEAR(created_at) = 2023`
    },
    {
      fileName: 'update.sql',
      code: `UPDATE users SET role = 'admin' WHERE id > 0`
    }
  ],
  go: [
    {
      fileName: 'main.go',
      code: `func divide(a int, b int) int {
\tresult := a / b
\treturn result
}

func main() {
\tfmt.Println(divide(10, 0))
}`
    },
    {
      fileName: 'handler.go',
      code: `func handleRequest(w http.ResponseWriter, r *http.Request) {
\tbody, _ := ioutil.ReadAll(r.Body)
\tvar data map[string]interface{}
\tjson.Unmarshal(body, &data)
\tquery := fmt.Sprintf("SELECT * FROM users WHERE name='%s'", data["name"])
\trows, _ := db.Query(query)
\tfmt.Fprintf(w, "%v", rows)
}`
    }
  ],
  bash: [
    {
      fileName: 'deploy.sh',
      code: `#!/bin/bash
USER_INPUT=$1
eval $USER_INPUT

rm -rf /
echo "Deploy complete"`
    },
    {
      fileName: 'backup.sh',
      code: `#!/bin/bash
PASSWORD="super_secret_123"
mysqldump -u root -p$PASSWORD mydb > backup.sql
curl -F "file=@backup.sql" http://my-storage.com/upload`
    }
  ]
}

export const LANGS = Object.keys(CODE_SNIPPETS)
