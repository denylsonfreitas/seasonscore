import { useState, useEffect } from "react";
import { getUserData } from "../services/users";

export function useUsersData(userIds: string[]) {
  const [usersData, setUsersData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUsersData = async () => {
      setIsLoading(true);
      try {
        const uniqueUserIds = [...new Set(userIds)];
        const promises = uniqueUserIds.map(userId => getUserData(userId));
        const results = await Promise.all(promises);
        
        const newUsersData: Record<string, any> = {};
        uniqueUserIds.forEach((userId, index) => {
          newUsersData[userId] = results[index];
        });
        
        setUsersData(newUsersData);
        setError(null);
      } catch (error) {
        setError(error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userIds.length > 0) {
      fetchUsersData();
    }
  }, [userIds.join(",")]);

  return { usersData, isLoading, error };
} 