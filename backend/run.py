from app import create_app

app = create_app()

if __name__ == '__main__':
    # Run the application using the port specified in the config
    app.run(host='0.0.0.0', port=app.config['PORT'], debug=(app.config['FLASK_ENV'] == 'development'))