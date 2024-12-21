from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import create_engine, text
from werkzeug.security import generate_password_hash, check_password_hash
import ast
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
import uuid
from datetime import datetime, date, timedelta
from collections import defaultdict
from fuzzywuzzy import fuzz
import pytesseract
from PIL import Image
import re
import random

app = Flask(__name__)
CORS(app)
# Declare Engine
DATABASE_URI = 'postgresql://postgres@localhost:5432/yourdatabase'
engine = create_engine(DATABASE_URI)
#Declare Nutrition Engine
NUTRITION_DATABASE_URI = 'postgresql://postgres@localhost:5432/nutritiondb'
nutrition_engine = create_engine(NUTRITION_DATABASE_URI)
#Declare User Engine
USER_DATABASE_URI = 'postgresql://postgres@localhost:5432/userdb'
user_engine = create_engine(USER_DATABASE_URI)
Session = sessionmaker(bind=user_engine)
session = Session()

@app.route('/api/food', methods=['GET'])
def get_food_data():
    query = request.args.get('query')
    search_length = request.args.get('searchLength')
    token = request.args.get('token')
    print(token)
    if token:
        user_data = get_user_from_token(token)
        username = user_data[1]
    if query:
        food_data = search(query, search_length, username)
    else:
        with nutrition_engine.connect() as connection:
            result = connection.execute(text("SELECT * FROM nutrition"))
            food_data = [dict(zip(result.keys(), row)) for row in result]
    
    return jsonify(food_data)

def search(query, length, username):
    search_column = 'Name'

    results = []
    seen_descriptions = set()

    with nutrition_engine.connect() as connection:
        query_text = text(f"""
        SELECT "{search_column}", "Calories", "Serving_G", "Alt_Serving", "Protein", "Carb", "Fat", 
               "Saturated_Fat", "Trans_Fat", "Sodium", "Sugar", "Fiber", "Added_Sugar", 
               "Caffeine", "Alcohol", "Cholesterol", "Micronutrients", "Ingredients", verified
        FROM nutrition
        WHERE to_tsvector('english', "{search_column}") @@ to_tsquery('english', :query)
        ORDER BY "verified" ASC
        LIMIT {length}
        """)
        result = connection.execute(query_text, {'query': query})
        
        for row in result:
            name = row[0]
            calories = row[1]
            serving_g = row[2]
            alt_serving = row[3]
            protein = row[4]
            carb = row[5]
            fat = row[6]
            saturated_fat = row[7]
            trans_fat = row[8]
            sodium = row[9]
            sugar = row[10]
            fiber = row[11]
            added_sugar = row[12]
            caffeine = row[13]
            alcohol = row[14]
            cholesterol = row[15]
            micronutrients = row[16]
            ingredients = row[17]
            verified = row[18]

            if name not in seen_descriptions:
                seen_descriptions.add(name)
                avoiding, including = reuseable_ingredient_check(username, ingredients)

                results.append({
                    'Name': name,
                    'Calories': calories,
                    'Serving_G': serving_g,
                    'Alt_Serving': alt_serving,
                    'Protein': protein,
                    'Carb': carb,
                    'Fat': fat,
                    'Saturated_Fat': saturated_fat,
                    'Trans_Fat': trans_fat,
                    'Sodium': sodium,
                    'Sugar': sugar,
                    'Fiber': fiber,
                    'Added_Sugar': added_sugar,
                    'Caffeine': caffeine,
                    'Alcohol': alcohol,
                    'Cholesterol': cholesterol,
                    'Micronutrients': micronutrients,
                    'Ingredients': ingredients,
                    'Avoiding': avoiding,
                    'Including': including,
                    'verified': verified
                })
    return results

@app.route('/api/foodHistory', methods=['GET'])
def get_food_data_history():
    query = request.args.get('query')
    length = request.args.get('searchLength')
    if query:
        food_data = search_history(query, length)
    else:
        with user_engine.connect() as connection:
            result = connection.execute(text("SELECT * FROM logged_food"))
            food_data = [dict(zip(result.keys(), row)) for row in result]
    
    return jsonify(food_data)

def search_history(query, length):
    token = request.args.get('token')
    print(token)
    if token:
        user_data = get_user_from_token(token)
        username = user_data[1]

    search_column = 'description'
    results = []
    seen_descriptions = set()

    with user_engine.connect() as conn:
        search_query = text(f""" SELECT meal, logged_servings, selected_servings, calories, protein, saturated_fat, trans_fat, fat,
        carbohydrates, fiber, sugars, sodium, cholesterol, iron, calcium, ingredients, date, description, serving_multiplier
        FROM logged_food WHERE to_tsvector('english', "description") @@ to_tsquery('english', :query)
        LIMIT {length}
        """)
        result = conn.execute(search_query, {'username': username, 'query': query})
        for res in result:
            meal = res[0]
            logged_servings = res[1]
            selected_servings = res[2]
            calories = res[3]
            protein = res[4]
            saturated_fat = res[5]
            trans_fat = res[6]
            fat = res[7]
            carbohydrates = res[8]
            fiber = res[9]
            sugars = res[10]
            sodium = res[11]
            cholesterol = res[12]
            iron = res[13]
            calcium = res[14]
            ingredients = res[15]
            date = res[16]
            description = res[17]
            serving_multiplier = res[18]
            servings_value, serving_unit = selected_servings.split(' ')

            # Calculate the new serving size
            serving_size = f'{float(servings_value) / float(serving_multiplier):.2f} {serving_unit}'
            if description not in seen_descriptions:
                seen_descriptions.add(description)
                avoiding, including = reuseable_ingredient_check(username, ingredients)

                results.append({'meal': meal, 
                                'logged_servings': logged_servings, 
                                'selected_servings': selected_servings,
                                'calories': calories / serving_multiplier,
                                'protein': protein / serving_multiplier,
                                'saturated_fat': saturated_fat / serving_multiplier,
                                'trans_fat': trans_fat / serving_multiplier,
                                'fat': fat / serving_multiplier,
                                'carbohydrates': carbohydrates / serving_multiplier,
                                'fiber': fiber / serving_multiplier,
                                'sugars': sugars / serving_multiplier,
                                'sodium': sodium / serving_multiplier,
                                'cholesterol': cholesterol / serving_multiplier,
                                'iron': iron / serving_multiplier,
                                'calcium': calcium / serving_multiplier,
                                'ingredients': ingredients,
                                'date': date,
                                'serving_size': serving_size,
                                'description': description,
                                'avoiding': avoiding,
                                'including': including
                                })
    return results
@app.route('/api/foodCustom', methods=['GET'])
def get_food_data_custom():
    query = request.args.get('query')
    length = request.args.get('searchLength')
    token = request.args.get('token')
    
    if token:
        user_data = get_user_from_token(token)
        username = user_data[1]
    
    if query:
        food_data = search_custom(query, length, username)
    else:
        with nutrition_engine.connect() as connection:
            result = connection.execute(text("SELECT * FROM user_inputted_foods WHERE created_by = :username"), {'username': username})
            food_data = [dict(zip(result.keys(), row)) for row in result]
    
    return jsonify(food_data)

def search_custom(query, length, username):
    results = []
    seen_descriptions = set()

    with nutrition_engine.connect() as conn:
        search_query = text(f""" 
        SELECT name, calories, serving_g, alt_serving, protein, carb, fat, saturated_fat,
        trans_fat, sodium, sugar, fiber, added_sugar, caffeine, alcohol, cholesterol, micronutrients, ingredients
        FROM user_inputted_foods 
        WHERE to_tsvector('english', "name") @@ to_tsquery('english', :query) 
        AND created_by = :username
        LIMIT {length}
        """)
        result = conn.execute(search_query, {'username': username, 'query': query})
        
        for res in result:
            name = res[0]
            calories = res[1]
            serving_g = res[2]
            alt_serving = res[3]
            protein = res[4]
            carb = res[5]
            fat = res[6]
            saturated_fat = res[7]
            trans_fat = res[8]
            sodium = res[9]
            sugar = res[10]
            fiber = res[11]
            added_sugar = res[12]
            caffeine = res[13]
            alcohol = res[14]
            cholesterol = res[15]
            micronutrients = res[16]
            ingredients = res[17]

            if name not in seen_descriptions:
                seen_descriptions.add(name)
                avoiding, including = reuseable_ingredient_check(username, ingredients)

                results.append({ 
                    'name': name,
                    'calories': calories,
                    'serving_g':  serving_g,
                    'alt_serving': alt_serving,
                    'protein': protein,
                    'carb': carb,
                    'fat': fat,
                    'saturated_fat': saturated_fat,
                    'trans_fat': trans_fat,
                    'sodium': sodium,
                    'sugar': sugar,
                    'fiber': fiber,
                    'added_sugar': added_sugar,
                    'caffeine': caffeine,
                    'alcohol': alcohol,
                    'cholesterol': cholesterol,
                    'micronutrients': micronutrients,
                    'ingredients': ingredients,
                    'avoiding': avoiding,
                    'including': including
                })
    print(f'Results: {results}')
    return results

@app.route('/api/retreiveRecentHistory', methods=['GET'])
def retrieve_recent_logs():
    auth = request.headers.get('Authorization')
    if auth:
        token = auth.split(" ")[1]
        user_data = get_user_from_token(token)
        username = user_data[1]

        query = text(""" 
        SELECT meal, logged_servings, selected_servings, calories, protein, saturated_fat, trans_fat, fat,
               carbohydrates, fiber, sugars, sodium, cholesterol, iron, calcium, ingredients, date, description, serving_multiplier
        FROM logged_food 
        WHERE user_id = :username
        ORDER BY date DESC
        LIMIT 10;
        """)

        results = []
        seen_descriptions = set()

        with user_engine.connect() as conn:
            result = conn.execute(query, {'username': username})
            for res in result:
                print(res)
                meal = res[0]
                logged_servings = res[1]
                selected_servings = res[2]
                calories = res[3]
                protein = res[4]
                saturated_fat = res[5]
                trans_fat = res[6]
                fat = res[7]
                carbohydrates = res[8]
                fiber = res[9]
                sugars = res[10]
                sodium = res[11]
                cholesterol = res[12]
                if res[13]:
                    iron = res[13]
                else:
                    iron = 0
                if res[14]:
                    calcium = res[14]
                else:
                    calcium = 0
                ingredients = res[15]
                date = res[16]
                description = res[17]
                serving_multiplier = res[18]
                
            if selected_servings == 'null':
                serving_size = 1  # Default serving size when selected_servings is 'null'
            elif len(selected_servings.split(' ')) > 1:
                # More than one part means it contains a unit (e.g., "28 g")
                parts = selected_servings.split(' ')
                value = float(parts[0]) / float(serving_multiplier)
                serving_size = f'{value} {parts[1]}'
            else:
                # Only one part, meaning it is just a number (e.g., "28")
                serving_size = float(selected_servings) / float(serving_multiplier)

                if description not in seen_descriptions:
                    seen_descriptions.add(description)
                    avoiding, including = reuseable_ingredient_check(username, ingredients)
                    results.append({
                        'meal': meal,
                        'logged_servings': logged_servings,
                        'selected_servings': selected_servings,
                        'calories': calories / serving_multiplier,
                        'protein': protein / serving_multiplier,
                        'saturated_fat': saturated_fat / serving_multiplier,
                        'trans_fat': trans_fat / serving_multiplier,
                        'fat': fat / serving_multiplier,
                        'carbohydrates': carbohydrates / serving_multiplier,
                        'fiber': fiber / serving_multiplier,
                        'sugars': sugars / serving_multiplier,
                        'sodium': sodium / serving_multiplier,
                        'cholesterol': cholesterol / serving_multiplier,
                        'iron': iron / serving_multiplier,
                        'calcium': calcium / serving_multiplier,
                        'ingredients': ingredients,
                        'date': date,
                        'serving_size': serving_size,
                        'description': description,
                        'avoiding': avoiding,
                        'including': including
                    })

        return jsonify(results)
    return jsonify({"error": "Unauthorized"}), 401
@app.route('/api/retrieveCustom', methods=['GET'])
def retrieve_custom():
    auth = request.headers.get('Authorization')
    if auth:
        token = auth.split(' ')[1]
        user_data = get_user_from_token(token)
        username = user_data[1]
    query = text(""" SELECT name, calories, serving_g, alt_serving, protein, carb, fat,
    saturated_fat, trans_fat, sodium, sugar, fiber, added_sugar, caffeine, alcohol, cholesterol,
    micronutrients, ingredients
    FROM user_inputted_foods
    WHERE created_by = :username
    """)
    with nutrition_engine.connect() as conn:
        results = conn.execute(query, {'username': username})
        final_results = []
        for res in results:
            name = res[0]
            calories = res[1]
            serving_g = res[2]
            alt_serving = res[3]
            protein = res[4]
            carb = res[5]
            fat = res[6]
            saturated_fat = res[7]
            trans_fat = res[8]
            sodium = res[9]
            sugar = res[10]
            fiber = res[11]
            added_sugar = res[12]
            caffeine = res[13]
            alcohol = res[14]
            cholesterol = res[15]
            micronutrients = res[16]
            ingredients = res[17]
            avoiding, including = reuseable_ingredient_check(username, ingredients)
            final_results.append({ 
                    'name': name,
                    'calories': calories,
                    'serving_g':  serving_g,
                    'alt_serving': alt_serving,
                    'protein': protein,
                    'carb': carb,
                    'fat': fat,
                    'saturated_fat': saturated_fat,
                    'trans_fat': trans_fat,
                    'sodium': sodium,
                    'sugar': sugar,
                    'fiber': fiber,
                    'added_sugar': added_sugar,
                    'caffeine': caffeine,
                    'alcohol': alcohol,
                    'cholesterol': cholesterol,
                    'micronutrients': micronutrients,
                    'ingredients': ingredients,
                    'avoiding': avoiding,
                    'including': including
                })
            

    return final_results

@app.route('/api/profile', methods=['POST'])
def create_profile():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'error': 'Missing required fields'}), 400

    hashed_password = generate_password_hash(password)

    try:
        with user_engine.connect() as connection:
            connection.execute(
                text("""
                INSERT INTO users (username, email, password)
                VALUES (:username, :email, :password)
                """),
                {'username': username, 'email': email, 'password': password}
            )
            # Commit the transaction
            connection.commit()
        
        return jsonify({'message': 'Profile created successfully'}), 201

    except Exception as e:
        # Rollback the transaction if there's an error
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Missing required fields'}), 400

    sql = text("SELECT * FROM users WHERE username = :username AND password = :password")
    with user_engine.connect() as conn:
        result = conn.execute(sql, {'username': username, 'password': password})
        user = result.fetchone()

    if user:
        # Generate a new token
        token = str(uuid.uuid4())
        print(f"Generated token: {token}")

        # Update the users table with the new token
        update_sql = text("UPDATE users SET token = :token WHERE username = :username")
        with user_engine.connect() as conn:
            update_result = conn.execute(update_sql, {'token': token, 'username': username})
            if update_result.rowcount == 0:
                print("Token update failed")
            else:
                print("Token update successful")
                conn.commit()

        return jsonify({'token': token}), 200
    else:
        return jsonify({'error': 'Invalid username or password'}), 401
def get_user_from_token(token):
    sql = text("SELECT * FROM users WHERE token = :token")
    with user_engine.connect() as conn:
        result = conn.execute(sql, {'token': token})
        user = result.fetchone()
    return user

@app.route('/api/log', methods=['POST'])
def log_food():
    data = request.json
    current_date = datetime.now().strftime('%Y-%m-%d')
    try:
        input_date = datetime.strptime(data['date'], '%d-%m-%Y')
        formatted_date = input_date.strftime('%Y-%m-%d')
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400
    print(data['date'])

    # Extract token from Authorization header
    authorization_header = request.headers.get('Authorization')
    if authorization_header:
        token = authorization_header.split()[1]
        print(f'Token received: {token}')
        user_data = get_user_from_token(token)
        
        if not user_data:
            return jsonify({'error': 'Invalid token'}), 401

        log_query = text("""
            INSERT INTO logged_food (user_id, meal, logged_servings, selected_servings, serving_multiplier, description, calories, protein, 
                                    saturated_fat, trans_fat, fat, carbohydrates, fiber, sugars, sodium, cholesterol, 
                                    iron, calcium, ingredients, date)
            VALUES (:user_id, :meal, :logged_servings, :selected_servings, :serving_multiplier, :description, :calories, :protein, 
                    :saturated_fat, :trans_fat, :fat, :carbohydrates, :fiber, :sugars, :sodium, :cholesterol, 
                    :iron, :calcium, :ingredients, :date)
        """)

        try:
            with user_engine.connect() as conn:
                conn.execute(log_query, {
                    'user_id': user_data[1],
                    'meal': data['meal'],
                    'logged_servings': data['servings'],
                    'selected_servings': data['selectedServings'],
                    'serving_multiplier': data['servingMultiplier'],
                    'description': data['foodDetails']['description'],
                    'calories': data['foodDetails']['calories'],
                    'protein': data['foodDetails']['protein'],
                    'saturated_fat': data['foodDetails']['saturatedFat'],
                    'trans_fat': data['foodDetails']['transFat'],
                    'fat': data['foodDetails']['fat'],
                    'carbohydrates': data['foodDetails']['carbohydrates'],
                    'fiber': data['foodDetails']['fiber'],
                    'sugars': data['foodDetails']['sugars'],
                    'sodium': data['foodDetails']['sodium'],
                    'cholesterol': data['foodDetails']['cholesterol'],
                    'iron': data['foodDetails']['iron'],
                    'calcium': data['foodDetails']['calcium'],
                    'ingredients': data['foodDetails']['ingredients'],
                    'date': formatted_date,
                })
                conn.commit()
            return jsonify({'message': 'Food details logged successfully'}), 201
        except Exception as e:
            print('failed to log food:', e)
            return jsonify({'error': 'Failed to log food'}), 500
    else:
        return jsonify({'error': 'Missing authorization token'}), 401

@app.route('/api/meals', methods=['GET', 'POST'])
def retrieve_meals():
    print('retreiving meals')
    date = request.args.get('activateDate')
    authorization_header = request.args.get('token')
    
    if authorization_header:
        token = authorization_header
        print(f'Token received: {token}')
        user_data = get_user_from_token(token)
        if not user_data:
            return jsonify({'error': 'Invalid token'}), 401
    else:
        return jsonify({'error': 'Missing authorization token'}), 401
    
    if not date:
        return jsonify({'error': 'activateDate not provided'}), 400
    
    # Validate and reformat the date
    try:
        reformatted_date = datetime.strptime(date, '%d-%m-%Y').strftime('%Y-%m-%d')
    except ValueError:
        return jsonify({'error': 'activateDate format is incorrect'}), 400
    
    retrieve_query = text("""
    SELECT user_id, meal, logged_servings, selected_servings, serving_multiplier, description, calories, protein, 
           saturated_fat, trans_fat, fat, carbohydrates, fiber, sugars, sodium, cholesterol, 
           iron, calcium, ingredients, date
    FROM logged_food
    WHERE date = :date AND user_id = :user_id
    """)
    
    with user_engine.connect() as conn:
        result = conn.execute(retrieve_query, {'date': reformatted_date, 'user_id': user_data[1]})
        meals = result.fetchall()
    
    meals_list = []
    column_names = [
        'user_id', 'meal', 'logged_servings', 'selected_servings', 'serving_multiplier', 'description',
        'calories', 'protein', 'saturated_fat', 'trans_fat', 'fat', 'carbohydrates',
        'fiber', 'sugars', 'sodium', 'cholesterol', 'iron', 'calcium', 'ingredients', 'date'
    ]
    
    for row in meals:
        meals_list.append(dict(zip(column_names, row)))
    for meal in meals_list:
        print(meal['meal'])

    return jsonify(meals_list)

@app.route('/api/remove', methods=['POST'])
def remove_food():
    data = request.get_json()
    food = data.get('food')
    description = food['description']
    log_date = food['date']
    logged_servings = food['logged_servings']
    user_id = food['user_id']

    try:
        # Perform the delete operation
        session.execute(
            text(""" DELETE FROM logged_food 
                     WHERE description = :description AND date = :log_date
                     AND logged_servings = :logged_servings AND user_id = :user_id
                 """),
            {'description': description, 'log_date': log_date, 'logged_servings': logged_servings, 'user_id': user_id}
        )
        session.commit()
        return jsonify({'message': 'Food details removed successfully'}), 200
    except Exception as e:
        session.rollback()
        return jsonify({'message': 'Error occurred', 'error': str(e)}), 500
    finally:
        session.close()

@app.route('/api/removemeal', methods=['POST'])
def remove_meal():
    data = request.get_json()
    cur_date = data.get('date')
    split_date = cur_date.split('-')
    formatted_date = f'{split_date[2]}-{split_date[1]}-{split_date[0]}'

    meal = data.get('meal')
    token = data.get('token')
    user_data = get_user_from_token(token)
    user_id = user_data[1]

    print(meal)
    print(formatted_date)
    print(user_id)

    remove_query = text("""DELETE FROM logged_food
                            WHERE date = :cur_date AND meal = :meal AND user_id = :user_id
    """)
    
    with user_engine.connect() as conn:
        try:
            result = conn.execute(remove_query, {'cur_date': formatted_date, 'meal': meal, 'user_id': user_id})
            conn.commit()
            print(f"Rows affected: {result.rowcount}")
        except Exception as e:
            session.rollback()

    return 'balls'
@app.route('/api/update_meals', methods=['POST'])
def update_meals():
    data = request.get_json()
    cur_date = data.get('date')
    split_date = cur_date.split('-')
    formatted_date = f'{split_date[2]}-{split_date[1]}-{split_date[0]}'
    
    token = data.get('token')
    user_data = get_user_from_token(token)
    user_id = user_data[1]
    
    # Step 1: Retrieve the logged meals for the specific date and user
    get_meals_query = text("""
        SELECT id, meal 
        FROM logged_food 
        WHERE date = :cur_date AND user_id = :user_id
        ORDER BY meal ASC
    """)
    
    with user_engine.connect() as conn:
        meals = conn.execute(get_meals_query, {'cur_date': formatted_date, 'user_id': user_id}).fetchall()
        
        # Step 2: Reassign the meal numbers starting from 1
        for i, meal_record in enumerate(meals, start=1):
            meal_id = meal_record[0]  # 'id' is the first item in the tuple
            new_meal = f'Meal {i}'
            
            # Step 3: Update the table with the new meal numbers
            update_meal_query = text("""
                UPDATE logged_food 
                SET meal = :new_meal 
                WHERE id = :meal_id
            """)
            
            conn.execute(update_meal_query, {'new_meal': new_meal, 'meal_id': meal_id})
        
        conn.commit()
    
    return jsonify({'message': 'Meals updated successfully'}), 200

@app.route('/api/setNutrientGoals', methods=['POST'])
def set_goals():
    data = request.get_json()
    calories = data.get('calories')
    protein = data.get('protein')
    fat = data.get('fat')
    carbs = data.get('carbs')
    alcohol = data.get('alcohol')
    token = data.get('token')
    avoiding_ingredients = data.get('avoidingIngredientsTotal')
    including_ingredients = data.get('includingIngredientsTotal')
    selected_weight_goal = data.get('selectedWeightGoal')
    selected_rate = data.get('selectedRate')
    update_goals_query = text("""
    UPDATE users
    SET goal_calories = :calories,
        goal_protein = :protein,
        goal_fat = :fat,
        goal_carbs = :carbs,
        goal_alcohol = :alcohol,
        avoiding_ingredients = :avoiding_ingredients,
        including_ingredients = :including_ingredients,
        selected_weight_goal = :selected_weight_goal,
        selected_rate = :selected_rate
    WHERE token = :token
    """)
    with user_engine.connect() as conn:
        conn.execute(update_goals_query, {
            'calories': calories,
            'protein': protein,
            'fat': fat,
            'carbs': carbs,
            'alcohol': alcohol,
            'avoiding_ingredients': avoiding_ingredients,
            'including_ingredients': including_ingredients,
            'token': token,
            'selected_weight_goal': selected_weight_goal,
            'selected_rate': selected_rate
        })
        conn.commit()
    print('Update Successful')
    return "balls"

@app.route('/api/fetchNutrientGoals', methods=['GET'])
def send_nutrient_goals():
    token = request.headers.get('Authorization')
    if token:
        token = token.split(" ")[1]
        print(f'fetched token: {token}')

        fetch_query = text("""
        SELECT goal_calories, goal_protein, goal_fat, goal_carbs,
               goal_alcohol, avoiding_ingredients, including_ingredients, selected_weight_goal, selected_rate
        FROM users WHERE token = :token
        """)

        with user_engine.connect() as conn:
            result = conn.execute(fetch_query, {'token': token}).fetchone()

            if result:
                # Accessing result by index instead of column name
                nutrient_goals = {
                    'goal_calories': result[0],
                    'goal_protein': result[1],
                    'goal_fat': result[2],
                    'goal_carbs': result[3],
                    'goal_alcohol': result[4],
                    'avoiding_ingredients': result[5],
                    'including_ingredients': result[6],
                    'selected_weight_goal': result[7],
                    'selected_rate': result[8]
                }
                return jsonify(nutrient_goals)
            else:
                return jsonify({'error': 'No goals found for the provided token'}), 404
    else:
        return jsonify({'error': 'Token is missing'}), 403
@app.route('/api/removeIngredient', methods=['POST'])
def remove_ingredient():
    data = request.json
    token = data.get('token')
    setting = data.get('setting')
    ingredient = data.get('ingredient')
    user_data = get_user_from_token(token)
    username = user_data[1]
    if setting == 'avoid':
        query = text("""
            UPDATE users 
            SET avoiding_ingredients = array_remove(avoiding_ingredients, :ingredient)
            WHERE username = :username
        """)
    if setting == 'include':
        query = text("""
            UPDATE users 
            SET including_ingredients = array_remove(including_ingredients, :ingredient)
            WHERE username = :username
        """)
    with user_engine.connect() as conn:
        conn.execute(query, {'ingredient': ingredient, 'username': username})
        conn.commit()

    return "Success"
    
@app.route('/api/logWeight', methods=['POST', 'GET'])
def log_weight():
    token = request.headers.get('Authorization')
    data = request.get_json()
    weight = data['weight']
    if token:
        token = token.split(" ")[1]
        print(f'fetched token: {token}')

        user_data = get_user_from_token(token)
        username = user_data[1]

    log_query = text("""INSERT INTO user_weight (username, weight)
                        VALUES (:username, :weight)""")
    try:
        with user_engine.connect() as conn:
            conn.execute(log_query, {'weight': weight, 'username': username})
            conn.commit()
        return jsonify({'message': 'Weight logged successfully'}), 201
    except Exception as e:
        print('failed to log weight:', e)
        return jsonify({'error': 'Failed to log weight'}), 500
@app.route('/api/retreiveWeight', methods=['GET'])
def retreive_weight_data(): 
    try:
        token = request.headers.get('Authorization')
        if token:
            token = token.split(" ")[1]
            print(f'fetched token: {token}')

            user_data = get_user_from_token(token)
            if not user_data:
                return {"error": "Invalid token"}, 401
            
            user_id = user_data[1]

            query = text("""SELECT weight, recorded_at, unit, index FROM user_weight
                            WHERE username = :user_id
            """)

            with user_engine.connect() as conn:
                results = conn.execute(query, {'user_id': user_id}).fetchall()
                
                print(f"Weight Results: {results}")
            
            # Access each column by index
            weights = [{"weight": row[0], "date": row[1], "unit": row[2], "index": row[3]} for row in results]

            response_data = [
                {
                    'weight': row[0],
                    'recorded_at': row[1],
                    'unit': row[2],
                    'index': row[3]
                }
                for row in results
            ]

            weights_for_avg = [d['weight'] for d in response_data]
            dates = [d['recorded_at'] for d in response_data]

            daily_changes = [weights_for_avg[i] - weights_for_avg[i-1] for i in range(1, len(weights_for_avg))]

            def moving_average(values, window_size):
                return [
                    sum(values[max(0, i - window_size + 1):i + 1]) / len(values[max(0, i - window_size + 1):i + 1])
                    for i in range(len(values))
                ]

            window_size = 30
            moving_avg_changes = moving_average(daily_changes, window_size)

            averages_data = []
            for i in range(len(moving_avg_changes)):
                averages_data.append({
                    'date': dates[i+1],  
                    'daily_change': daily_changes[i],
                    'moving_avg_change': moving_avg_changes[i]
                })

            return {"weights": weights, "averages": averages_data}, 200
        else:
            return {"error": "Authorization header missing"}, 400
    except Exception as e:
        print(f"An error occurred: {e}")
        return {"error": "An internal server error occurred"}, 500
@app.route('/api/removeWeight', methods=['POST'])
def remove_weight():
    token = request.headers.get('Authorization')
    data = request.json.get('logs')
    print(f'data: {data}')
    
    date_str = data['dateTime']
    date_obj = datetime.strptime(date_str, "%b %d, %Y %H:%M:%S")
    formatted_date = date_obj.strftime("%Y-%m-%d %H:%M:%S")

    weight = data['weight']
    index = data['index']
    
    if token:
        print(f'fetched token: {token}')
        
        user_data = get_user_from_token(token)
        if not user_data:
            return {"error": "Invalid token"}, 401
        
        user_id = user_data[1]

        # Correct the SQL DELETE statement
        query = """DELETE FROM user_weight 
                   WHERE username = :user_id 
                   AND index = :index
                   AND weight = :weight"""
                   
        with user_engine.connect() as conn:
            result = conn.execute(text(query), {'user_id': user_id, 'weight': weight, 'index': index})
            conn.commit()
            print(f"Rows affected: {result.rowcount}")
            
    return "Success"

@app.route('/api/calculateWeightChange')
def calculate_weight_change():
    try:
        token = request.headers.get('Authorization')
        if token:
            token = token.split(" ")[1]
            print(f'Fetched token: {token}')

            user_data = get_user_from_token(token)
            if not user_data:
                return {"error": "Invalid token"}, 401
            
            user_id = user_data[1]

            query = text("""SELECT weight, recorded_at, unit, index FROM user_weight
                            WHERE username = :user_id
                            ORDER BY recorded_at
            """)

            with user_engine.connect() as conn:
                result = conn.execute(query, {'user_id': user_id})
                data = result.fetchall()

            response_data = [
                {
                    'weight': row[0],
                    'recorded_at': row[1],
                    'unit': row[2],
                    'index': row[3]
                }
                for row in data
            ]

            weights = [d['weight'] for d in response_data]
            dates = [d['recorded_at'] for d in response_data]

            daily_changes = [weights[i] - weights[i-1] for i in range(1, len(weights))]

            def moving_average(values, window_size):
                return [
                    sum(values[max(0, i - window_size + 1):i + 1]) / len(values[max(0, i - window_size + 1):i + 1])
                    for i in range(len(values))
                ]

            window_size = 7
            moving_avg_changes = moving_average(daily_changes, window_size)

            final_data = []
            for i in range(len(moving_avg_changes)):
                final_data.append({
                    'date': dates[i+1],  
                    'daily_change': daily_changes[i],
                    'moving_avg_change': moving_avg_changes[i]
                })

            return jsonify(final_data)
    except Exception as e:
        print(f'Failed: {e}')
        return {"error": "Failed to calculate weight change"}, 500

    
@app.route('/api/updateHistory')
def update_user_data():
    authorization_header = request.headers.get('Authorization')
    
    if authorization_header:
        token = authorization_header.split(" ")[1]
        print(f'Token received: {token}')
        user_data = get_user_from_token(token)
        if not user_data:
            return jsonify({'error': 'Invalid token'}), 401
    else:
        return jsonify({'error': 'Missing authorization token'}), 401
    
    days = request.args.get('days', default=7, type=int)

    retrieve_query = text(f"""
    SELECT user_id, meal, logged_servings, selected_servings, serving_multiplier, description, calories, protein, 
           saturated_fat, trans_fat, fat, carbohydrates, fiber, sugars, sodium, cholesterol, 
           iron, calcium, ingredients, date
    FROM logged_food
    WHERE user_id = :user_id
    AND date >= CURRENT_DATE - INTERVAL '{days} days'
    """)

    with user_engine.connect() as conn:
        result = conn.execute(retrieve_query, {'user_id': user_data[1]})
        meals = result.fetchall()
        
    # Manually map the rows to a dictionary
    meals_dicts = [
        {
            'user_id': row[0],
            'meal': row[1],
            'logged_servings': row[2],
            'selected_servings': row[3],
            'serving_multiplier': row[4],
            'description': row[5],
            'calories': row[6],
            'protein': row[7],
            'saturated_fat': row[8],
            'trans_fat': row[9],
            'fat': row[10],
            'carbohydrates': row[11],
            'fiber': row[12],
            'sugars': row[13],
            'sodium': row[14],
            'cholesterol': row[15],
            'iron': row[16],
            'calcium': row[17],
            'ingredients': row[18],
            'date': row[19],
        }
        for row in meals
    ]
    accurate_days = []
    for m in meals_dicts:
        if m['date'] not in accurate_days:
            accurate_days.append(m['date'])
    day_count = len(accurate_days)
    calorie_dict ={}
    total_cals = sum(row['calories'] for row in meals_dicts)
    total_protein = sum(row['protein'] for row in meals_dicts)
    total_fat = sum(row['fat'] for row in meals_dicts)
    total_carbs = sum(row['carbohydrates'] for row in meals_dicts)

    avg_cals = total_cals / day_count
    avg_protein = total_protein / day_count
    avg_fat = total_fat / day_count
    avg_carbs = total_carbs / day_count

    # Prepare the response data
    response_data = {
        'meals': meals_dicts,
        'totals': {
            'total_calories': total_cals,
            'total_protein': total_protein,
            'total_fat': total_fat,
            'total_carbohydrates': total_carbs
        },
        'averages': {
            'average_calories': avg_cals,
            'average_protein': avg_protein,
            'average_fat': avg_fat,
            'average_carbohydrates': avg_carbs
        }
    }

    return jsonify(response_data)

@app.route('/api/checkIngredients', methods=['POST'])
def check_ingredients():
    authorization_header = request.headers.get('Authorization')
    if authorization_header:
        token = authorization_header.split(" ")[1]
        print(f'Token received: {token}')
        user_data = get_user_from_token(token)


        query = text(""" SELECT avoiding_ingredients, including_ingredients FROM users WHERE username = :user_id """)

        with user_engine.connect() as conn:
            result = conn.execute(query, {'user_id': user_data[1]}).fetchone()
            if result:
                avoiding_ingredients = result[0]
                including_ingredients = result[1]
    ingredients = request.json.get('ingredients')
    ingredients = ingredients.split(',')
    matched_ingredients_avoid = []
    matched_ingredients_include = []
    for ingredient in ingredients:
        for avoiding in avoiding_ingredients:
            score = fuzz.partial_ratio(ingredient.lower(), avoiding.lower())
            if score > 80:
                matched_ingredients_avoid.append(ingredient)
        for including in including_ingredients:
            score = fuzz.partial_ratio(ingredient.lower(), including.lower())
            if score > 80:
                matched_ingredients_include.append(ingredient)
    return jsonify(matched_ingredients_avoid, matched_ingredients_include)

def reuseable_ingredient_check(username, ingredients):
    query = text(""" SELECT avoiding_ingredients, including_ingredients FROM users WHERE username = :user_id """)

    with user_engine.connect() as conn:
        result = conn.execute(query, {'user_id': username}).fetchone()
        if result:
            avoiding_ingredients = result[0]
            including_ingredients = result[1]
    if ingredients:
        ingredients = ingredients.split(',')
        matched_ingredients_avoid = []
        matched_ingredients_include = []
        for ingredient in ingredients:
            for avoiding in avoiding_ingredients:
                score = fuzz.partial_ratio(ingredient.lower(), avoiding.lower())
                if score > 80:
                    matched_ingredients_avoid.append(ingredient)
            for including in including_ingredients:
                score = fuzz.partial_ratio(ingredient.lower(), including.lower())
                if score > 80:
                    matched_ingredients_include.append(ingredient)
    else:
        matched_ingredients_avoid = []
        matched_ingredients_include = []
    return matched_ingredients_avoid, matched_ingredients_include


from datetime import datetime, timedelta

def calculate_maintenance_calories(weights, calorie_intakes):
    # Get today's date and the date 30 days ago
    today = datetime.today().date()
    past_month_date = today - timedelta(days=30)
    
    # Filter dates to include only those within the past month
    valid_dates = [
        date for date in sorted(set(weights.keys()).union(set(calorie_intakes.keys())))
        if past_month_date <= date <= today and date in weights and date in calorie_intakes
    ]
    
    if not valid_dates:
        raise ValueError("No overlapping dates between weights and calorie intakes within the past month.")
    
    # Determine the start and end weights as averages over 7 days if there are more than 7 valid dates
    if len(valid_dates) > 7:
        start_weight = sum(weights[date] for date in valid_dates[:7]) / 7
        end_weight = sum(weights[date] for date in valid_dates[-7:]) / 7
    else:
        start_weight = weights[valid_dates[0]]
        end_weight = weights[valid_dates[-1]]
    
    weight_change = end_weight - start_weight
    
    caloric_surplus_deficit = weight_change * 3500 
    
    total_calories_consumed = sum(calorie_intakes[date] for date in valid_dates)
    
    average_daily_intake = total_calories_consumed / len(valid_dates)
    
    maintenance_calories = average_daily_intake - (caloric_surplus_deficit / len(valid_dates))
    
    return maintenance_calories, average_daily_intake, (caloric_surplus_deficit / 7)


@app.route('/api/bodyMeasurements', methods=['GET'])
def retrieve_measurements():
    auth = request.headers.get('Authorization')
    if auth:
        token = auth.split(" ")[1]
        user_data = get_user_from_token(token)
        username = user_data[1]

        food_query = text(""" SELECT * FROM logged_food
        WHERE user_id = :username
        """)

        weight_query = text(""" SELECT * FROM user_weight
        WHERE username = :username
        """)

        with user_engine.connect() as conn:
            food_result = conn.execute(food_query, {'username': username})
            weight_result = conn.execute(weight_query, {'username': username})

            weight_dict = {}
            for weight in weight_result:
                if weight[2].date() in weight_dict:
                    weight_dict[weight[2].date()] = (weight_dict[weight[2].date()] + weight[1]) / 2
                else:
                    weight_dict[weight[2].date()] = weight[1]

            food_dict = {}
            for food in food_result:
                if food[20] in food_dict:
                    food_dict[food[20]] += food[7]
                else:
                    food_dict[food[20]] = food[7]
        maintenance_calories = calculate_maintenance_calories(weight_dict, food_dict)
    return jsonify(maintenance_calories)

@app.route('/api/calc', methods=['GET'])
def calculate_cals():
    auth = request.headers.get('Authorization')
    if auth:
        token = auth.split(" ")[1]
        user_data = get_user_from_token(token)
        username = user_data[1]

    food_query = text(""" SELECT * FROM logged_food
    WHERE user_id = :username
    """)

    weight_query = text(""" SELECT * FROM user_weight
    WHERE username = :username
    """)
    with user_engine.connect() as conn:
        food_result = conn.execute(food_query, {'username': username})
        weight_result = conn.execute(weight_query, {'username': username})
    for i in weight_result:
        print(i)
    return 'balls'
@app.route('/api/getCurrentWeight', methods=['GET'])
def calc_current_weight():
    auth = request.headers.get('Authorization')
    if auth:
        token = auth.split(" ")[1]
        user_data = get_user_from_token(token)
        username = user_data[1]
        query = text("""
            SELECT weight, recorded_at, unit
            FROM user_weight
            WHERE username = :username
            AND recorded_at >= NOW() - INTERVAL '7 days'
            ORDER BY recorded_at DESC
        """)
        previous_week_query = text("""
            SELECT weight
            FROM user_weight
            WHERE username = :username
            AND recorded_at >= CURRENT_TIMESTAMP - INTERVAL '14 days'
            AND recorded_at < CURRENT_TIMESTAMP - INTERVAL '7 days'
            ORDER BY recorded_at DESC
        """)
        with user_engine.connect() as conn:
            results = conn.execute(query, {'username': username})
            results_prev = conn.execute(previous_week_query, {'username': username})
            
            total_weight_cur = 0
            weight_count_cur = 0
            for result in results:
                total_weight_cur += result[0]
                weight_count_cur += 1
            avg_weight = total_weight_cur / weight_count_cur

            total_weight_prev = 0
            weight_count_prev = 0
            for result in results_prev:
                total_weight_prev += result[0]
                weight_count_prev += 1
            avg_weight_prev = total_weight_prev / weight_count_prev
    return jsonify(avg_weight, avg_weight_prev)
@app.route('/api/getStats', methods=['GET'])
def retrieve_user_stats():
    auth = request.headers.get('Authorization')
    if auth:
        token = auth.split(" ")[1]
        user_data = get_user_from_token(token)
        username = user_data[1]
        
        query = text(""" SELECT goal_calories, goal_protein, goal_fat, goal_carbs, height, age, activity_level, gender 
                         FROM users
                         WHERE username = :username
                      """)
        with user_engine.connect() as conn:
            result = conn.execute(query, {'username': username}).fetchone()
            print(result)
        
        if result:
            # Convert the SQL result to a dictionary
            user_stats = {
                'goal_calories': result[0],
                'goal_protein': result[1],
                'goal_fat': result[2],
                'goal_carbs': result[3],
                'height': result[4],
                'age': result[5],
                'activity_level': result[6],
                'gender': result[7]
            }
            return jsonify(user_stats)  # Return the JSON response
        else:
            return jsonify({'error': 'User not found'}), 404
    return jsonify({'error': 'Authorization token missing'}), 401

def height_to_cm(feet, inches):
    return (feet * 30.48) + (inches * 2.54)

# Convert weight from pounds to kilograms
def weight_to_kg(weight_lbs):
    return weight_lbs * 0.453592

# Calculate BMR for men or women
def calculate_bmr(weight_kg, height_cm, age, gender):
    age = int(age)  # Convert age to an integer
    gender = gender.lower()  # Convert gender to lowercase to avoid case sensitivity issues
    if gender == 'male':
        return 88.362 + (13.397 * weight_kg) + (4.799 * height_cm) - (5.677 * age)
    elif gender == 'female':
        return 447.593 + (9.247 * weight_kg) + (3.098 * height_cm) - (4.330 * age)
    return 0

# Calculate maintenance calories
def calculate_calories(bmr, activity_level):
    activity_multipliers = {
        'Sedentary': 1.2,
        'Light': 1.375,
        'Moderate': 1.55,
        'Heavy': 1.725,
        'Extreme': 1.9
    }
    return bmr * activity_multipliers.get(activity_level, 1.2)

@app.route('/api/calculateCalorieNeeds', methods=["POST"])
def calculate_calorie_needs():
    auth = request.headers.get('Authorization')
    if auth:
        token = auth.split(" ")[1]
        user_data = get_user_from_token(token)
        username = user_data[1]
    
    data = request.get_json()
    print(data)
    
    height_feet = int(data.get('heightFeet', 0))
    height_inches = int(data.get('heightInches', 0))
    weight_lbs = float(data.get('weight', 0))
    activity_level = data.get('activityLevel', 'Sedentary')
    age = int(data['age'])  # Convert age to an integer
    gender = data['gender'] 

    height_cm = height_to_cm(height_feet, height_inches)
    weight_kg = weight_to_kg(weight_lbs)

    bmr = calculate_bmr(weight_kg, height_cm, age, gender)
    
    maintenance_calories = calculate_calories(bmr, activity_level)
    
    return jsonify(maintenance_calories)

@app.route('/api/saveCalculatedMacros', methods=['POST'])
def save_calculated_macros():
    auth = request.headers.get('Authorization')
    if auth:
        token = auth.split(" ")[1]
        user_data = get_user_from_token(token)
        username = user_data[1]
    
    data = request.get_json()
    height_inches = data['heightInches']
    height_feet = data['heightFeet']
    height = (float(height_feet) * 12) + float(height_inches)

    query = text("""
        UPDATE users
        SET height = :height, 
            age = :age, 
            activity_level = :activity_level, 
            goal_calories = :goal_calories, 
            goal_protein = :goal_protein, 
            goal_fat = :goal_fat, 
            goal_carbs = :goal_carbs,
            gender = :gender,
            goal_alcohol = 0
        WHERE username = :username
    """)

    with user_engine.connect() as conn:
        conn.execute(query, {'username': username, 'height': height, 
                             'age': data['age'], 'activity_level': data['activityLevel'],
                             'goal_calories': data['calorieNeeds'], 'goal_protein': data['proteinGrams'],
                             'goal_fat': data['fatGrams'], 'goal_carbs': data['carbGrams'],
                             'gender': data['gender']})
        conn.commit()

    print(data)
    return "Success"

@app.route('/api/createFood', methods=["POST"])
def create_food():
    auth = request.headers.get('Authorization')
    if auth:
        token = auth.split(" ")[1]
        user_data = get_user_from_token(token)
        username = user_data[1]

    data = request.get_json()

    # Replace empty strings with None (which translates to NULL in SQL)
    for key, value in data.items():
        if value == '':
            data[key] = 0
    
    # Add the username and micronutrients fields to data
    data['username'] = username
    data['micronutrients'] = f"Iron: {data.get('iron', '')}, Calcium: {data.get('calcium', '')}, Vitamin D: {data.get('vitaminD', '')}, Potassium: {data.get('potassium', '')}"

    query = text(""" 
        INSERT INTO user_inputted_foods (
            name, 
            calories, 
            serving_g, 
            protein, 
            carb, 
            fat, 
            saturated_fat, 
            trans_fat, 
            sodium, 
            sugar, 
            fiber, 
            added_sugar, 
            caffeine, 
            alcohol, 
            cholesterol, 
            micronutrients, 
            ingredients,
            created_by
        ) VALUES (
            :description, 
            :calories, 
            :servingSize, 
            :protein, 
            :carbohydrates, 
            :fat, 
            :satFat, 
            :transFat, 
            :sodium, 
            :sugar, 
            :fiber, 
            :addedSugar, 
            :caffeine, 
            :alcohol, 
            :cholesterol, 
            :micronutrients, 
            :ingredients,
            :username
        )
    """)

    with nutrition_engine.connect() as conn:
        conn.execute(query, data)
        conn.commit()

    return 'Food created successfully'

@app.route('/api/saveCoachSettings', methods=['POST'])
def save_coach_settings():
    data = request.get_json()
    print(data)
    
    auth = request.headers.get('Authorization')
    if auth:
        token = auth.split(" ")[1]
        user_data = get_user_from_token(token)
        username = user_data[1]
    coach_enabled = data['coachEnabled']
    selected_personality = data['selectedPersonality']
    notifications = data['notifications']
    weight_notifications = data['weightNotifications']
    log_reminders = data['logReminders']
    calorie_reminders = data['calorieReminders']
    progress_updates = data['progressUpdates']
    
    # SQL query to update the user's settings
    query = text("""
        UPDATE users
        SET coach_enabled = :coach_enabled,
            selected_personality = :selected_personality,
            notifications = :notifications,
            weight_notifications = :weight_notifications,
            log_reminders = :log_reminders,
            calorie_reminders = :calorie_reminders,
            progress_updates = :progress_updates
        WHERE username = :username
    """)
    
    # Execute the query
    with user_engine.connect() as conn:
        conn.execute(query, {
            'coach_enabled': coach_enabled,
            'selected_personality': selected_personality,
            'notifications': notifications,
            'weight_notifications': weight_notifications,
            'log_reminders': log_reminders,
            'calorie_reminders': calorie_reminders,
            'progress_updates': progress_updates,
            'username': username
        })
        conn.commit()
    
    return "success"

@app.route('/api/nutritionTrendsCoach', methods=['GET'])
def send_trend_messages():
    auth = request.headers.get('Authorization')
    cals = request.args.get('cals')
    prot = request.args.get('protein')
    fat = request.args.get('fat')
    carbs = request.args.get('carbs')
    if auth:
        token = auth.split(" ")[1]
        user_data = get_user_from_token(token)
        print(user_data)
    goal_cals = user_data[5]
    goal_prot = user_data[6]
    goal_fat = user_data[7]
    goal_carbs = user_data[8]
    
    date_selected = request.args.get('seldate')
    
    calorie_over_messages_very_kind = [
        f"Looks like you may have exceeded your calorie goals on {date_selected}. It happens to the best of us.",
        f"Calories look a little high on {date_selected}. No worries, keep on track and you'll keep making progress!",
        f"Don't stress about the extra calories on {date_selected}. You're doing great overall!",
        f"Over your calorie goal on {date_selected}? It’s okay, tomorrow is a new day!",
        f"You went over your calorie intake on {date_selected}. Remember, it’s about progress, not perfection!"
    ]

    calorie_over_messages_kind = [
        f"You exceeded your calorie limit on {date_selected}. It's important to stay mindful, but don't be too hard on yourself.",
        f"Calories were above your goal on {date_selected}. Keep pushing forward, and you'll hit your targets!",
        f"A bit over your calorie goal on {date_selected}. Reflect on it and let’s get back on track!",
        f"{date_selected} saw a higher calorie intake than planned. Focus on making healthier choices today.",
        f"You went over your calories on {date_selected}. Just a reminder to balance things out tomorrow!"
    ]

    calorie_over_messages_strict = [
        f"Your calorie intake on {date_selected} was above the goal. Stay disciplined and stick to your plan.",
        f"You exceeded your calorie target on {date_selected}. No excuses, let's tighten things up.",
        f"{date_selected} was not a good day for calories. It's time to refocus and avoid this again.",
        f"Calories were over the limit on {date_selected}. You need to be more consistent if you want to reach your goals.",
        f"You went over your calorie budget on {date_selected}. This can't become a habit—stay on track!"
    ]

    calorie_over_messages_asshole = [f"Went over your calories on {date_selected} fatty. Look in the mirror and be ashamed of yourself",
                                     f"Looks like the little piggy had too much fun at the market on {date_selected}", 
                                     f"Dont think nobody saw {date_selected}. I am always watching.",
                                     f"You could've fed starving children all across the world on {date_selected}. Instead your fat ass decided to go to the buffet. Do better.",
                                     f"I feel bad for your toilet. {date_selected} must've been a warzone. Maybe lay off the extra fries and get some exercise."]
    protein_over_messages_very_kind = [
    f"Great effort on {date_selected}, but you may have gone a bit over on protein. It’s all about balance!",
    f"Looks like you exceeded your protein goal on {date_selected}. You're still doing awesome, just keep an eye on it!",
    f"A little too much protein on {date_selected}. Don't worry, you're still on the right track!",
    f"Protein intake was a bit high on {date_selected}. Keep going strong, you’re doing well!",
    f"You went over your protein goal on {date_selected}. Keep it balanced, and you'll continue to progress!"
    ]

    protein_over_messages_kind = [
        f"You went over your protein goal on {date_selected}. Remember, balance is key!",
        f"Protein was a bit high on {date_selected}. Try to adjust next time!",
        f"{date_selected} saw a higher protein intake than planned. Focus on hitting the right amount!",
        f"Your protein intake exceeded the goal on {date_selected}. Aim to stay within your target!",
        f"Protein was over on {date_selected}. Keep an eye on your intake moving forward."
    ]

    protein_over_messages_strict = [
        f"You exceeded your protein target on {date_selected}. Stay focused on your goals!",
        f"Your protein intake was too high on {date_selected}. Stick to the plan!",
        f"{date_selected} was over the limit for protein. This needs to be corrected.",
        f"Protein intake was above the target on {date_selected}. Stay disciplined.",
        f"You went over on protein on {date_selected}. This can hinder your progress—tighten up your diet!"
    ]
    protein_over_messages_very_strict = [
        f"Looks like somebody couldn't put down the chicken on {date_selected}. Bak Bak",
        f"I cant imagine what your farts smelled like on {date_selected}!",
    ]
    carbs_over_messages_very_kind = [
        f"Oops! It looks like you may have had a bit too many carbs on {date_selected}. It’s okay, just keep moving forward!",
        f"You exceeded your carb goal on {date_selected}, but don’t worry, you’re still making great progress!",
        f"A few too many carbs on {date_selected}. You’re doing great—just try to balance it out!",
        f"Carbs were a bit high on {date_selected}. Keep up the good work and stay mindful!",
        f"You went over your carb intake on {date_selected}. Remember, small adjustments lead to big results!"
    ]

    carbs_over_messages_kind = [
        f"You went over your carb limit on {date_selected}. Keep working on balancing your meals!",
        f"Carb intake was high on {date_selected}. Try to make better choices tomorrow!",
        f"{date_selected} saw a higher carb intake than planned. Let’s get back on track!",
        f"Your carb intake exceeded the goal on {date_selected}. Focus on staying within your limits!",
        f"Carbs were over on {date_selected}. Balance is key—let's aim for that moving forward!"
    ]

    carbs_over_messages_strict = [
        f"You exceeded your carb goal on {date_selected}. You need to be more mindful of your intake.",
        f"Carb intake was too high on {date_selected}. This isn't aligned with your goals.",
        f"{date_selected} was over the limit for carbs. This needs to be addressed.",
        f"Carbs were above target on {date_selected}. You must stay consistent to achieve your goals.",
        f"You went over on carbs on {date_selected}. This could set you back—stay on track!"
    ]
    carbs_over_messages_asshole = [
        f"How if the flying fuck did you even eat that many carbs on {date_selected}. Wildly dissapointing!",
        f"Were you trying to speedrun diabetes on {date_selected}? If so you might be nearing a world record.",
        f"Are you an actual child? {date_selected} looked like you ate pop tarts for breakfast, lunch, and dinner. Get your shit together and lay off the carbs",
        f"{date_selected} had too many carbs, not enough progress. Get it together.",
        f"Somebody went over their carb goal on {date_selected}. Your family is probably dissapointed in you and so am I"
    ]
    fats_over_messages_very_kind = [
        f"It looks like you may have exceeded your fat intake on {date_selected}. No big deal, you’re doing great overall!",
        f"You went a bit over on fats on {date_selected}. It’s okay, just keep an eye on it!",
        f"Fats were a little high on {date_selected}. Keep focusing on your goals, you’ve got this!",
        f"Fat intake was above the goal on {date_selected}. Don’t worry, you’re still making progress!",
        f"You exceeded your fat goal on {date_selected}. Keep up the good work and stay mindful of your intake!"
    ]

    fats_over_messages_kind = [
        f"You went over your fat limit on {date_selected}. Stay mindful of your intake moving forward!",
        f"Fat intake was high on {date_selected}. Let's aim to adjust that!",
        f"{date_selected} saw a higher fat intake than planned. Remember to balance your meals!",
        f"Your fat intake exceeded the goal on {date_selected}. Keep working on hitting your targets!",
        f"Fats were over on {date_selected}. Try to stay within your goal next time!"
    ]

    fats_over_messages_strict = [
        f"You exceeded your fat goal on {date_selected}. You need to be more disciplined.",
        f"Fat intake was too high on {date_selected}. This isn’t aligned with your goals.",
        f"{date_selected} was over the limit for fats. This needs to be corrected.",
        f"Fats were above target on {date_selected}. Stay focused on your goals.",
        f"You went over on fats on {date_selected}. This can hinder your progress—tighten up your diet!"
    ]
    fats_over_messages_asshole = [
        f"Were you drinking straight butter on {date_selected}?!?!? Get a hold of yourself mate",
        f"{date_selected}... We all love cheeseburgers but you aren't allowed to love cheeseburgers yet. Earn it",
        f"Fats are looking a little high on {date_selected}... So was your weight",
        f"I know keto diets are all the rage right now but drinking straight up oil is not cool. Control yourself for fuck sake. {date_selected} was unacceptable.",
        f"{date_selected} was ridiculous but the lard man does what the lard man wants to do. Unless i'm watching..."
    ]
    calories_under_messages_very_kind = [
        f"It seems you were a bit under your calorie goal on {date_selected}. No worries, just make sure you're getting enough energy!",
        f"Calories were a bit low on {date_selected}. Remember, fueling your body is important!",
        f"You were under your calorie target on {date_selected}. It’s okay, just try to eat a bit more next time!",
        f"Calorie intake was below your goal on {date_selected}. Keep nourishing your body well!",
        f"You went under your calorie goal on {date_selected}. Keep an eye on your intake to stay energized!"
    ]

    calories_under_messages_kind = [
        f"You didn’t hit your calorie goal on {date_selected}. Remember to eat enough to support your goals!",
        f"Calorie intake was low on {date_selected}. Let’s try to reach your target next time!",
        f"{date_selected} saw a lower calorie intake than planned. Be sure to get the nutrients you need!",
        f"Your calorie intake was under the goal on {date_selected}. It’s important to stay fueled up!",
        f"Calories were under on {date_selected}. Make sure you're eating enough to stay strong!"
    ]

    calories_under_messages_strict = [
        f"Your calorie intake on {date_selected} was too low. You need to ensure you’re eating enough.",
        f"You didn’t hit your calorie target on {date_selected}. This can slow your progress.",
        f"{date_selected} was under the limit for calories. This needs to be corrected.",
        f"Calories were too low on {date_selected}. You must stay on top of your nutrition.",
        f"You went under your calorie budget on {date_selected}. This isn't sustainable—make sure you’re eating enough!"
    ]
    calories_under_messages_asshole = [
        f"Somebody should've picked up the fork on {date_selected}. Grow up.",
        f"You're not getting any bigger eating like that. Don't think I didn't see {date_selected}",
        f"Weren't hungry on {date_selected}? Too bad, get to eating.",
        f"On {date_selected}, I smelled a skinny little bitch. You better not be the one stinking",
        f"Keep eating like you did on {date_selected} and you're finding love."
    ]
    protein_under_messages_very_kind = [
        f"It looks like you didn’t quite hit your protein goal on {date_selected}. No worries, just aim for a little more next time!",
        f"Protein intake was a bit low on {date_selected}. Keep doing your best—you’re doing great!",
        f"You were under your protein target on {date_selected}. It’s okay, just try to get a bit more in next time!",
        f"Protein was below your goal on {date_selected}. Keep fueling those muscles!",
        f"You went under your protein goal on {date_selected}. A little extra effort will get you there!"
    ]

    protein_under_messages_kind = [
        f"You didn’t hit your protein goal on {date_selected}. Remember, protein is key for your progress!",
        f"Protein intake was low on {date_selected}. Aim to reach your target next time!",
        f"{date_selected} saw a lower protein intake than planned. Let’s focus on getting enough next time!",
        f"Your protein intake was under the goal on {date_selected}. It's important for muscle growth!",
        f"Protein was under on {date_selected}. Make sure to get enough to support your goals!"
    ]

    protein_under_messages_strict = [
        f"Your protein intake on {date_selected} was too low. This will slow your progress.",
        f"You didn’t hit your protein target on {date_selected}. This isn't acceptable.",
        f"{date_selected} was under the limit for protein. This needs to be corrected.",
        f"Protein was too low on {date_selected}. You must prioritize your protein intake.",
        f"You went under on protein on {date_selected}. This can set you back—focus on hitting your goals!"
    ]
    protein_under_messages_asshole = [
        f"Somebody undershot their protein on {date_selected}...",
        f"Looks like {date_selected} wasn't your day. Keep eating like that and you're day is never coming along",
        f"How do you expect to get big eating that little protein? Unless you wanna look like a toddler, you better not eat like you did on {date_selected}",
        f"Did you just forget to eat on {date_selected}?",
        f"Buy some fucking protein powder its not that hard. {date_selected} was not cool"
    ]
    carbs_under_messages_very_kind = [
        f"It seems you didn’t reach your carb goal on {date_selected}. No worries, just aim for more next time!",
        f"Carb intake was a bit low on {date_selected}. Keep up the good work and try to hit your target!",
        f"You were under your carb target on {date_selected}. It’s okay, just try to balance it out next time!",
        f"Carbs were below your goal on {date_selected}. Keep fueling your energy levels!",
        f"You went under your carb goal on {date_selected}. A little extra carbs will keep you energized!"
    ]

    carbs_under_messages_kind = [
        f"You didn’t hit your carb goal on {date_selected}. Remember, carbs are important for energy!",
        f"Carb intake was low on {date_selected}. Let’s try to reach your target next time!",
        f"{date_selected} saw a lower carb intake than planned. Be sure to get enough energy!",
        f"Your carb intake was under the goal on {date_selected}. It’s important to fuel up properly!",
        f"Carbs were under on {date_selected}. Make sure you're eating enough to stay energized!"
    ]

    carbs_under_messages_strict = [
        f"Your carb intake on {date_selected} was too low. You need to ensure you’re eating enough.",
        f"You didn’t hit your carb target on {date_selected}. This can slow your progress.",
        f"{date_selected} was under the limit for carbs. This needs to be corrected.",
        f"Carbs were too low on {date_selected}. You must stay on top of your nutrition.",
        f"You went under your carb budget on {date_selected}. This isn't sustainable—make sure you’re eating enough!"
    ]
    carbs_under_messages_asshole  = [
        f"Missed your carbs on {date_selected}? No worries, you'll just be small forever",
        f"Not enough carbs on {date_selected}. Try again but better. Like a lot better",
        f"A few more grams of carbs on {date_selected} and mayed you'd be less of a miserable asshole all the time."
    ]
    fats_under_messages_very_kind = [
        f"It looks like you didn’t quite hit your fat goal on {date_selected}. No worries, just aim for a little more next time!",
        f"Fat intake was a bit low on {date_selected}. Keep doing your best—you’re doing great!",
        f"You were under your fat target on {date_selected}. It’s okay, just try to get a bit more in next time!",
        f"Fat was below your goal on {date_selected}. Keep fueling your body well!",
        f"You went under your fat goal on {date_selected}. A little extra effort will get you there!"
    ]

    fats_under_messages_kind = [
        f"You didn’t hit your fat goal on {date_selected}. Remember, healthy fats are important for your progress!",
        f"Fat intake was low on {date_selected}. Aim to reach your target next time!",
        f"{date_selected} saw a lower fat intake than planned. Let’s focus on getting enough next time!",
        f"Your fat intake was under the goal on {date_selected}. It's important for overall health!",
        f"Fat was under on {date_selected}. Make sure to get enough to support your goals!"
    ]

    fats_under_messages_strict = [
        f"Your fat intake on {date_selected} was too low. This will slow your progress.",
        f"You didn't hit your fat target on {date_selected}. This isn't acceptable.",
        f"{date_selected} was under the limit for fats. This needs to be corrected.",
        f"Fats were too low on {date_selected}. You must prioritize your fat intake.",
        f"You went under on fats on {date_selected}. This can set you back—focus on hitting your goals!"
    ]
    fats_under_messages_strict = [
        f"Seriously? Fats are the easiest macro to eat you useless piece of shit. If you weren't such a lazy ass maybe you'd eat more of them on {date_selected}",
        f"Should've eaten more fats on {date_selected}. Its not the 90s",
        f"You didn't eat enough fats on {date_selected}. I'm both mad and disapointed"
    ]
    fats_under_messages_asshole = [
        f"Seriously? Fats are the easiest macro to eat you useless piece of shit. If you weren't such a lazy ass maybe you'd eat more of them on {date_selected}",
        f"Should've eaten more fats on {date_selected}. Its not the 90s",
        f"You didn't eat enough fats on {date_selected}. I'm both mad and disapointed"
    ]
    calorie_over_messages_neutral = [
    f"You exceeded your calorie goal on {date_selected}.",
    f"Calorie intake was above the target on {date_selected}.",
    f"You went over your calorie limit on {date_selected}.",
    f"Calories exceeded the goal on {date_selected}.",
    f"Your calorie intake was higher than planned on {date_selected}."
]

    calorie_under_messages_neutral = [
        f"You were under your calorie goal on {date_selected}.",
        f"Calorie intake was below the target on {date_selected}.",
        f"You didn’t meet your calorie goal on {date_selected}.",
        f"Calories were under the goal on {date_selected}.",
        f"Your calorie intake was lower than planned on {date_selected}."
    ]

    protein_over_messages_neutral = [
        f"You exceeded your protein goal on {date_selected}.",
        f"Protein intake was above the target on {date_selected}.",
        f"You went over your protein limit on {date_selected}.",
        f"Protein exceeded the goal on {date_selected}.",
        f"Your protein intake was higher than planned on {date_selected}."
    ]

    protein_under_messages_neutral = [
        f"You were under your protein goal on {date_selected}.",
        f"Protein intake was below the target on {date_selected}.",
        f"You didn’t meet your protein goal on {date_selected}.",
        f"Protein was under the goal on {date_selected}.",
        f"Your protein intake was lower than planned on {date_selected}."
    ]

    carbs_over_messages_neutral = [
        f"You exceeded your carb goal on {date_selected}.",
        f"Carb intake was above the target on {date_selected}.",
        f"You went over your carb limit on {date_selected}.",
        f"Carbs exceeded the goal on {date_selected}.",
        f"Your carb intake was higher than planned on {date_selected}."
    ]

    carbs_under_messages_neutral = [
        f"You were under your carb goal on {date_selected}.",
        f"Carb intake was below the target on {date_selected}.",
        f"You didn’t meet your carb goal on {date_selected}.",
        f"Carbs were under the goal on {date_selected}.",
        f"Your carb intake was lower than planned on {date_selected}."
    ]

    fats_over_messages_neutral = [
        f"You exceeded your fat goal on {date_selected}.",
        f"Fat intake was above the target on {date_selected}.",
        f"You went over your fat limit on {date_selected}.",
        f"Fats exceeded the goal on {date_selected}.",
        f"Your fat intake was higher than planned on {date_selected}."
    ]

    fats_under_messages_neutral = [
        f"You were under your fat goal on {date_selected}.",
        f"Fat intake was below the target on {date_selected}.",
        f"You didn’t meet your fat goal on {date_selected}.",
        f"Fats were under the goal on {date_selected}.",
        f"Your fat intake was lower than planned on {date_selected}."
    ]


    coach_pers = user_data[19]
    goal = user_data[16]
    return_values = []
    if 'Asshole' in coach_pers:
        if goal == 'Gain' or goal == "Maintain":
            if goal_cals > float(cals) + 100:
                random_number = random.randint(0, (len(calories_under_messages_asshole) - 1))
                return_values.append(calories_under_messages_asshole[random_number]) 
            if goal_prot > float(prot) + 10:
                random_number = random.randint(0, (len(protein_under_messages_asshole) - 1))
                return_values.append(protein_under_messages_asshole[random_number])
            if goal_fat > float(fat) + 10:
                random_number = random.randint(0, (len(fats_under_messages_asshole) - 1))
                return_values.append(fats_under_messages_asshole[random_number])
            if goal_carbs > float(carbs) + 20:
                random_number = random.randint(0, (len(carbs_under_messages_asshole) - 1))
                return_values.append(carbs_under_messages_asshole[random_number])
        if goal == "Lose" or goal == "Maintain":
            if goal_cals < float(cals):
                random_number = random.randint(0, (len(calorie_over_messages_asshole) - 1))
                return_values.append(calorie_over_messages_asshole[random_number]) 
            if goal_fat < float(fat):
                random_number = random.randint(0, (len(fats_over_messages_asshole) - 1))
                return_values.append(fats_over_messages_asshole[random_number])
            if goal_carbs < float(carbs) + 20:
                random_number = random.randint(0, (len(carbs_over_messages_asshole) - 1))
                return_values.append(carbs_over_messages_asshole[random_number])
    elif "Strict" in coach_pers:
        if goal == 'Gain' or goal == "Maintain":
            if goal_cals > float(cals) + 100:
                random_number = random.randint(0, (len(calories_under_messages_strict) - 1))
                return_values.append(calories_under_messages_strict[random_number]) 
            if goal_prot > float(prot) + 10:
                random_number = random.randint(0, (len(protein_under_messages_strict) - 1))
                return_values.append(protein_under_messages_strict[random_number])
            if goal_fat > float(fat) + 10:
                random_number = random.randint(0, (len(fats_under_messages_strict) - 1))
                return_values.append(fats_under_messages_strict[random_number])
            if goal_carbs > float(carbs) + 20:
                random_number = random.randint(0, (len(carbs_under_messages_strict) - 1))
                return_values.append(carbs_under_messages_strict[random_number])
        if goal == "Lose" or goal == "Maintain":
            if goal_cals < float(cals):
                random_number = random.randint(0, (len(calorie_over_messages_strict) - 1))
                return_values.append(calorie_over_messages_strict[random_number]) 
            if goal_fat < float(fat):
                random_number = random.randint(0, (len(fats_over_messages_strict) - 1))
                return_values.append(fats_over_messages_strict[random_number])
            if goal_carbs < float(carbs) + 20:
                random_number = random.randint(0, (len(carbs_over_messages_strict) - 1))
                return_values.append(carbs_over_messages_strict[random_number])
    elif 'Neutral' in coach_pers:
        if goal == 'Gain' or goal == "Maintain":
            if goal_cals > float(cals) + 100:
                random_number = random.randint(0, (len(calorie_under_messages_neutral) - 1))
                return_values.append(calorie_under_messages_neutral[random_number]) 
            if goal_prot > float(prot) + 10:
                random_number = random.randint(0, (len(protein_under_messages_neutral) - 1))
                return_values.append(protein_under_messages_strict[random_number])
            if goal_fat > float(fat) + 10:
                random_number = random.randint(0, (len(fats_under_messages_neutral) - 1))
                return_values.append(fats_under_messages_neutral[random_number])
            if goal_carbs > float(carbs) + 20:
                random_number = random.randint(0, (len(carbs_under_messages_neutral) - 1))
                return_values.append(carbs_under_messages_neutral[random_number])
        if goal == "Lose" or goal == "Maintain":
            if goal_cals < float(cals):
                random_number = random.randint(0, (len(calorie_over_messages_neutral) - 1))
                return_values.append(calorie_over_messages_neutral[random_number]) 
            if goal_fat < float(fat):
                random_number = random.randint(0, (len(fats_over_messages_neutral) - 1))
                return_values.append(fats_over_messages_neutral[random_number])
            if goal_carbs < float(carbs) + 20:
                random_number = random.randint(0, (len(carbs_over_messages_neutral) - 1))
                return_values.append(carbs_over_messages_neutral[random_number])
    elif 'Kind' in coach_pers:
        if goal == 'Gain' or goal == "Maintain":
            if goal_cals > float(cals) + 100:
                random_number = random.randint(0, (len(calories_under_messages_kind) - 1))
                return_values.append(calories_under_messages_kind[random_number]) 
            if goal_prot > float(prot) + 10:
                random_number = random.randint(0, (len(protein_under_messages_kind) - 1))
                return_values.append(protein_under_messages_kind[random_number])
            if goal_fat > float(fat) + 10:
                random_number = random.randint(0, (len(fats_under_messages_kind) - 1))
                return_values.append(fats_under_messages_kind[random_number])
            if goal_carbs > float(carbs) + 20:
                random_number = random.randint(0, (len(carbs_under_messages_kind) - 1))
                return_values.append(carbs_under_messages_kind[random_number])
        if goal == "Lose" or goal == "Maintain":
            if goal_cals < float(cals):
                random_number = random.randint(0, (len(calorie_over_messages_kind) - 1))
                return_values.append(calorie_over_messages_kind[random_number]) 
            if goal_fat < float(fat):
                random_number = random.randint(0, (len(fats_over_messages_kind) - 1))
                return_values.append(fats_over_messages_kind[random_number])
            if goal_carbs < float(carbs) + 20:
                random_number = random.randint(0, (len(carbs_over_messages_kind) - 1))
                return_values.append(carbs_over_messages_kind[random_number])
    elif 'Incredibly' in coach_pers:
        if goal == 'Gain' or goal == "Maintain":
            if goal_cals > float(cals) + 100:
                random_number = random.randint(0, (len(calories_under_messages_very_kind) - 1))
                return_values.append(calories_under_messages_very_kind[random_number]) 
            if goal_prot > float(prot) + 10:
                random_number = random.randint(0, (len(protein_under_messages_very_kind) - 1))
                return_values.append(protein_under_messages_very_kind[random_number])
            if goal_fat > float(fat) + 10:
                random_number = random.randint(0, (len(fats_under_messages_very_kind) - 1))
                return_values.append(fats_under_messages_very_kind[random_number])
            if goal_carbs > float(carbs) + 20:
                random_number = random.randint(0, (len(carbs_under_messages_very_kind) - 1))
                return_values.append(carbs_under_messages_very_kind[random_number])
        if goal == "Lose" or goal == "Maintain":
            if goal_cals < float(cals):
                random_number = random.randint(0, (len(calorie_over_messages_very_kind) - 1))
                return_values.append(calorie_over_messages_very_kind[random_number]) 
            if goal_fat < float(fat):
                random_number = random.randint(0, (len(fats_over_messages_very_kind) - 1))
                return_values.append(fats_over_messages_very_kind[random_number])
            if goal_carbs < float(carbs) + 20:
                random_number = random.randint(0, (len(carbs_over_messages_very_kind) - 1))
                return_values.append(carbs_over_messages_very_kind[random_number])
    if len(return_values) == 0:
        return_values.append("Looks good, keep it up")
    
    return return_values
def check_macros_calories(meal_data):
    return 'c'

@app.route('/api/getGoals', methods=['GET'])
def get_goals():
    auth = request.headers.get('Authorization')
    if auth:
        token = auth.split(' ')[1]
        user_data = get_user_from_token(token)
        return jsonify(dict(user_data._mapping))

@app.route('/api/manageLabel', methods=['GET', 'POST'])
def upload_image():
    sample_image = 'IMG_6748.HEIC'
    img = Image.open(sample_image)

    detected_text = pytesseract.image_to_string(img)

    nutritional_info = parse_nutritional_values(detected_text)
    ingredients = parse_ingredients(detected_text)
    print(ingredients)
    print(nutritional_info)
    return 'balls'
def parse_nutritional_values(text):
    patterns = {
        "serving_size": r"serving size.*?(\d+.*?[gml])",
        "calories": r"calories\s+(\d+)",
        "total_fat": r"total fat.*?(\d+g)",
        "saturated_fat": r"saturated fat.*?(\d+g)",
        "cholesterol": r"cholesterol.*?(\d+mg)",
        "sodium": r"sodium.*?(\d+mg)",
        "total_carbohydrate": r"total carbohydrate.*?(\d+g)",
        "dietary_fiber": r"dietary fiber.*?(\d+g)",
        "total_sugars": r"total sugars.*?(\d+g)",
        "added_sugars": r"added sugars.*?(\d+g).*?(\d+%)",
        "protein": r"protein.*?(\d+g)",
        "vitamin_d": r"vitamin d.*?(\d+mcg)",
        "calcium": r"calcium.*?(\d+mg)",
        "iron": r"iron.*?(\d+mg)",
        "potassium": r"potassium.*?(\d+mg)",

        "vitamin_a": r"vitamin a.*?(\d+%)",
        "vitamin_c": r"vitamin c.*?(\d+%)",
        "vitamin_b6": r"vitamin b6.*?(\d+%)",
        "folic_acid": r"folic acid.*?(\d+mcg)",
        "magnesium": r"magnesium.*?(\d+mg)",
        "zinc": r"zinc.*?(\d+mg)"
    }

    nutritional_values = {}
    for key, pattern in patterns.items():
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            nutritional_values[key] = match.group(1)
    return nutritional_values

def parse_ingredients(text):
    match = re.search(r"ingredients[:\s]+([a-zA-Z0-9,.\s]+)", text, re.IGNORECASE)
    if match:
        ingredients = match.group(1).strip()
        return ingredients
    return None


if __name__ == '__main__':
    app.run(debug=True)
