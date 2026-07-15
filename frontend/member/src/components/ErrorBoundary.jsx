import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="card bg-base-100 max-w-md w-full">
            <div className="card-body text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="card-title justify-center text-lg">Что-то пошло не так</h2>
              <p className="text-sm text-base-content/60 mt-1">
                {this.state.error?.message || 'Произошла непредвиденная ошибка'}
              </p>
              <div className="card-actions justify-center mt-4">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                    window.location.reload();
                  }}
                >
                  Обновить страницу
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
