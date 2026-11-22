
import { createContext, useContext, useState, useEffect } from "react";
import httpClient from "../config/httpClient";
import { API_ENDPOINTS } from "../config/api";

const AuthContext = createContext();

// Dummy credentials for testing
const DUMMY_USERS = {
  employers: [
    {
      id: 1,
      email: "employer@company.com",
      password: "employer123",
      name: "John Smith",
      company: "Tech Solutions Inc.",
      role: "employer",
    },
    {
      id: 2,
      email: "hr@startup.com",
      password: "hr123",
      name: "Sarah Johnson",
      company: "Innovation Startup",
      role: "employer",
    },
  ],
  jobSeekers: [
    {
      id: 3,
      email: "jobseeker@email.com",
      password: "jobseeker123",
      name: "Alex Brown",
      title: "Software Developer",
      phone: "+1 (555) 123-4567",
      location: "San Francisco, CA",
      bio: "Experienced full-stack developer with 5 years in React and Node.js",
      skills: ["JavaScript", "React", "Node.js", "Python", "AWS"],
      experience: "5 years",
      portfolio: "https://alexbrown.dev",
      profileImage: null,
      resume:
        "data:application/pdf;base64,JVBERi0xLjcKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFsgMyAwIFIgXQovQ291bnQgMQo+PgplbmRvYmoKMyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDIgMCBSCi9NZWRpYUJveCBbIDAgMCA2MTIgNzkyIF0KL0NvbnRlbnRzIDQgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAyNCBUZgoxMDAgNzAwIFRkCihTYW1wbGUgUmVzdW1lKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDIxMCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDUKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjMwNQolJUVPRgo=",
      workHistory: [
        {
          id: 1,
          company: "Tech Solutions Inc.",
          position: "Senior Software Developer",
          startDate: "2020-01",
          endDate: "",
          current: true,
          description:
            "Led development of scalable web applications using React and Node.js. Managed a team of 3 developers.",
        },
      ],
      education: [
        {
          id: 1,
          degree: "Bachelor of Science in Computer Science",
          institution: "University of California, Berkeley",
          year: "2018",
          description: "Focused on software engineering and web technologies",
        },
      ],
      profileComplete: true,
      role: "jobSeeker",
    },
    {
      id: 4,
      email: "candidate@email.com",
      password: "candidate123",
      name: "Emma Davis",
      title: "Product Manager",
      phone: "+1 (555) 234-5678",
      location: "New York, NY",
      bio: "Strategic product manager with experience in agile development and market analysis",
      skills: [
        "Product Strategy",
        "Agile",
        "Analytics",
        "Leadership",
        "Market Research",
      ],
      experience: "7 years",
      portfolio: "https://emma-davis.com",
      profileImage: null,
      resume: null,
      workHistory: [
        {
          id: 1,
          company: "Innovation Startup",
          position: "Product Manager",
          startDate: "2021-03",
          endDate: "",
          current: true,
          description:
            "Managing product roadmap and working with cross-functional teams to deliver user-centered solutions.",
        },
      ],
      education: [
        {
          id: 1,
          degree: "Master of Business Administration",
          institution: "Stanford University",
          year: "2020",
          description:
            "Specialized in technology management and product development",
        },
      ],
      profileComplete: true,
      role: "jobSeeker",
    },
  ],
};

// Custom authentication hook
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

// Authentication Provider
export const AuthProvider = ({ children }) => {

  // 1. Initialize user from localStorage
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("jobPortalUser");
      const savedToken = localStorage.getItem("authToken");

      if (savedUser && savedToken) {
        const parsedUser = JSON.parse(savedUser);

        // Validate cached user data
        if (!parsedUser.email || !parsedUser.email.includes("@")) {
          console.warn(
            "[Auth] Invalid cached user data. Clearing localStorage..."
          );

          localStorage.removeItem("jobPortalUser");
          localStorage.removeItem("authToken");

          return null;
        }

        console.log("[Auth] User restored successfully");

        return parsedUser;
      }
    } catch (error) {
      console.error("[Auth] Error loading saved user:", error);

      localStorage.removeItem("jobPortalUser");
      localStorage.removeItem("authToken");
    }

    return null;
  });

  // 2. Loading state
  const [isLoading, setIsLoading] = useState(false);

  // 3. Persist user whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(
        "jobPortalUser",
        JSON.stringify(user)
      );
    } else {
      localStorage.removeItem("jobPortalUser");
      localStorage.removeItem("authToken");
    }
  }, [user]);

  // 4. Login
  const login = async (email, password, userType) => {
    setIsLoading(true);

    try {
      const response = await httpClient.post(API_ENDPOINTS.LOGIN, {
        username: email,
        password: password,
      });

      if (response.data && response.data.jwtToken) {
        const { jwtToken, user: userData } = response.data;

        // Store JWT token
        localStorage.setItem("authToken", jwtToken);

        // Create user object with role from backend
        const userWithRole = {
          ...userData,
          phone: userData.mobileNumber,
          role: userData.role,
          profileComplete: false,
        };

        // Check job seeker profile completeness
        if (userData.role === "ROLE_JOB_SEEKER") {
          try {
            const { getProfile } = await import(
              "../services/profileService"
            );

            const profileData = await getProfile();

            const isComplete = !!(
              profileData &&
              profileData.jobTitle &&
              profileData.location &&
              profileData.experienceLevel &&
              profileData.professionalBio &&
              profileData.profilePictureName &&
              profileData.resumeName
            );

            userWithRole.profileComplete = isComplete;

          } catch (error) {
            console.error(
              "[Auth] Error checking profile completeness:",
              error
            );
          }
        } else {
          // Employers don't need profile completion
          userWithRole.profileComplete = true;
        }

        setUser(userWithRole);
        setIsLoading(false);

        return {
          success: true,
          user: userWithRole,
        };

      } else {
        console.error("[Auth] Invalid response - missing jwtToken");

        setIsLoading(false);

        return {
          success: false,
          error: "Invalid response from server",
        };
      }

    } catch (error) {
      setIsLoading(false);

      console.error("[Auth] Login error:", error);

      if (error.response) {
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          `Authentication failed (${error.response.status})`;

        console.error("[Auth] Server error:", {
          status: error.response.status,
          data: error.response.data,
        });

        return {
          success: false,
          error: errorMessage,
        };

      } else if (error.request) {
        console.error("[Auth] No response from server");

        return {
          success: false,
          error:
            "Cannot connect to server. Please check if backend is running on http://localhost:8080",
        };

      } else {
        console.error("[Auth] Unexpected error:", error.message);

        return {
          success: false,
          error: "An unexpected error occurred: " + error.message,
        };
      }
    }
  };

  // 5. Registration
  const register = async (userData) => {
    setIsLoading(true);

    try {
      const response = await httpClient.post(API_ENDPOINTS.REGISTER, {
        name: userData.name,
        email: userData.email,
        mobileNumber: userData.mobileNumber,
        password: userData.password,
      });

      setIsLoading(false);

      const successMessage =
        typeof response.data === "string"
          ? response.data
          : response.data?.message ||
            "Registration successful! You can now login.";

      return {
        success: true,
        message: successMessage,
        data: response.data,
      };

    } catch (error) {
      setIsLoading(false);

      console.error("[Auth] Registration error:", error);

      if (error.response) {
        console.error("[Auth] Server error:", {
          status: error.response.status,
          data: error.response.data,
        });

        const errorData = error.response.data;

        if (
          errorData &&
          typeof errorData === "object" &&
          !errorData.message
        ) {
          return {
            success: false,
            fieldErrors: errorData,
          };
        }

        const errorMessage =
          errorData?.message ||
          errorData?.error ||
          (typeof errorData === "string" ? errorData : null) ||
          `Registration failed (${error.response.status})`;

        return {
          success: false,
          error: errorMessage,
        };

      } else if (error.request) {
        return {
          success: false,
          error:
            "Cannot connect to server. Please check if backend is running on http://localhost:8080",
        };

      } else {
        console.error("[Auth] Unexpected error:", error.message);

        return {
          success: false,
          error: "An unexpected error occurred: " + error.message,
        };
      }
    }
  };

  // 6. Update profile
  const updateProfile = async (profileData) => {
    if (!user) {
      return {
        success: false,
        error: "No user logged in",
      };
    }

    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedUser = {
        ...user,
        ...profileData,
        updatedAt: new Date().toISOString(),
      };

      // Update dummy data
      if (user.role === "employer") {
        const userIndex = DUMMY_USERS.employers.findIndex(
          (u) => u.id === user.id
        );

        if (userIndex !== -1) {
          DUMMY_USERS.employers[userIndex] = {
            ...DUMMY_USERS.employers[userIndex],
            ...updatedUser,
          };
        }

      } else {
        const userIndex = DUMMY_USERS.jobSeekers.findIndex(
          (u) => u.id === user.id
        );

        if (userIndex !== -1) {
          DUMMY_USERS.jobSeekers[userIndex] = {
            ...DUMMY_USERS.jobSeekers[userIndex],
            ...updatedUser,
          };
        }
      }

      setUser(updatedUser);
      setIsLoading(false);

      return {
        success: true,
        user: updatedUser,
      };

    } catch (error) {
      setIsLoading(false);

      return {
        success: false,
        error: "Failed to update profile",
      };
    }
  };

  // 7. Update profile completion status
  const updateProfileComplete = (isComplete) => {
    if (user) {
      const updatedUser = {
        ...user,
        profileComplete: isComplete,
      };

      setUser(updatedUser);
    }
  };

  // 8. Logout
  const logout = () => {
    setUser(null);

    localStorage.removeItem("authToken");
    localStorage.removeItem("jobPortalUser");
  };

  // 9. Context value
  const value = {
    user,
    isLoading,
    login,
    register,
    updateProfile,
    updateProfileComplete,
    logout,
    isAuthenticated: !!user,
    isEmployer: user?.role === "ROLE_EMPLOYER",
    isJobSeeker: user?.role === "ROLE_JOB_SEEKER",
    isAdmin: user?.role === "ROLE_ADMIN",
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
