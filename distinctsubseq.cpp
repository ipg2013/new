#include <bits/stdc++.h>
using namespace std;

int main() {
	//code
	int t;
	cin>>t;
	while(t--){
	    string s;
	    long long i, j, dp[1001]={}, k, l, mo=1000000007, ans=0;
	    cin>>s;s=" "+s;
	    l=s.length();
	    dp[0]=dp[1]=1;
	    for(i=2; i<l; i++){
	        j=i-1;
	        while(j>=0){
	            dp[i]+=dp[j];dp[i]%=mo;
	            if(s[j]==s[i])break;j--;
	        }
	       // cout<<dp[i]<<" ";
	    }
	    for(i=0; i<l; i++){
	        ans+=dp[i];
	        ans%=mo;
	    }//cout<<endl;
	    cout<<ans<<endl;
	    
	}
	return 0;
}