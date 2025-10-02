import React, { useState, useRef } from "react";
import axios from "axios";
import "./index.css";

const API_URL = "http://localhost:5000";

function App() {
  const fileInputRef = useRef(null);
  const [state, setState] = useState({
    fileName: null,
    jobDescription: "",
    resumeFile: null,
    results: null,
    isLoading: false,
    error: null,
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(pdf|doc|docx)$/i)) {
      setState({
        ...state,
        error: "Please upload a PDF, DOC, or DOCX file",
        resumeFile: null,
        fileName: null,
      });
      return;
    }

    setState({
      ...state,
      fileName: file.name,
      resumeFile: file,
      error: null,
    });
  };

  const handleSubmit = async () => {
    if (!state.jobDescription.trim()) {
      setState({
        ...state,
        error: "Please enter a job description",
      });
      return;
    }

    if (!state.resumeFile) {
      setState({
        ...state,
        error: "Please upload a resume",
      });
      return;
    }

    setState({ ...state, isLoading: true, error: null });

    try {
      const formData = new FormData();
      formData.append("job_description", state.jobDescription);
      formData.append("resume", state.resumeFile);

      const response = await axios.post(`${API_URL}/analyze`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
      });

      setState({
        ...state,
        results: response.data,
        isLoading: false,
      });
    } catch (error) {
      let errorMessage = "An error occurred. Please try again.";
      if (error.response) {
        errorMessage = error.response.data.error || errorMessage;
      } else if (error.request) {
        errorMessage = "Server is not responding. Please try later.";
      }

      setState({
        ...state,
        error: errorMessage,
        isLoading: false,
      });
    }
  };

  const resetForm = () => {
    // Clear the file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    setState({
      fileName: null,
      jobDescription: "",
      resumeFile: null,
      results: null,
      isLoading: false,
      error: null,
    });
  };

  return (
    <div className="container">
      <div className="top-section">
        <div className="description-box">
          <h2>Job Description</h2>
          <textarea
            className="txtarea"
            placeholder="Paste the job description here..."
            value={state.jobDescription}
            onChange={(e) =>
              setState({ ...state, jobDescription: e.target.value })
            }
            disabled={state.isLoading}
          />
        </div>

        <div className="upload-box">
          <p>Upload your resume (PDF/DOC/DOCX)</p>
          <input
            type="file"
            id="resume-upload"
            ref={fileInputRef}
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            disabled={state.isLoading}
          />
          <label 
            htmlFor="resume-upload" 
            className={state.isLoading ? "disabled" : ""}
          >
            Choose File
          </label>

          {state.fileName && (
            <p className="file-name">
              📄 {state.fileName}
              {!state.isLoading && (
                <button 
                  className="clear-file" 
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                    setState({ ...state, fileName: null, resumeFile: null });
                  }}
                >
                  ×
                </button>
              )}
            </p>
          )}

          <div className="action-buttons">
            <button
              className="analyze-btn"
              onClick={handleSubmit}
              disabled={state.isLoading || !state.resumeFile || !state.jobDescription.trim()}
            >
              {state.isLoading ? (
                <>
                  <span className="spinner"></span> Processing...
                </>
              ) : (
                "Analyze Resume"
              )}
            </button>

            {state.results && (
              <button 
                className="reset-btn" 
                onClick={resetForm}
                disabled={state.isLoading}
              >
                Reset
              </button>
            )}
          </div>

          {state.error && (
            <p className="error-message">
              ⚠️ {state.error}
            </p>
          )}
        </div>
      </div>

      <ResultsSection state={state} />
    </div>
  );
}

const ResultsSection = ({ state }) => {
  if (state.isLoading) {
    return (
      <div className="result-box">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Analyzing your resume...</p>
        </div>
      </div>
    );
  }

  if (!state.results) {
    return (
      <div className="result-box">
        <p className="placeholder-text">
          {state.error ||
            "Upload a resume and job description to see analysis results"}
        </p>
      </div>
    );
  }

  return (
    <div className="result-box">
      <h2>Analysis Results</h2>
      <div className="results-content">
        <div className="match-score">
          <h3>Match Score: {state.results.match_score}%</h3>
          <div className="score-bar">
            <div
              className="score-fill"
              style={{ width: `${state.results.match_score}%` }}
            />
          </div>
        </div>

        <div className="skills-section">
          {state.results.matched_skills.length > 0 && (
            <>
              <h4>Matched Skills:</h4>
              <ul>
                {state.results.matched_skills.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
              </ul>
            </>
          )}

          {state.results.missing_skills.length > 0 && (
            <>
              <h4>Missing Skills:</h4>
              <ul className="missing-skills">
                {state.results.missing_skills.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="suggestions">
          <h4>Suggestions:</h4>
          <p>{state.results.suggestions || "No specific suggestions available."}</p>
        </div>
      </div>
    </div>
  );
};

export default App;